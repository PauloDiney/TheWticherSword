import React, { useCallback, useEffect, useRef, useState } from 'react';
import swordModel from '../assets/model/sword.glb';
import heroTilt from '../assets/img/hero-tilt.webp';

// O GLB é Y-para-cima e vai de y=0 (base do pomo) a y=1,28 (ponta da lâmina),
// centrado em x=0/z=0. As posições abaixo saem direto da geometria de cada
// grupo de malhas do arquivo (blade, crossguard, grip, pommel).
//
// `orbit` fecha o enquadramento em cada peça: com o campo de visão de 30°, o
// raio necessário é (altura enquadrada / 2) / tan(15°).
const PARTS = [
  {
    id: 'tip',
    name: 'Ponta',
    desc: 'Perfil afilado da lâmina',
    hotspot: '0 1.26 0.015',
    target: '0m 1.2m 0m',
    orbit: '20deg 80deg 0.4m'
  },
  {
    id: 'blade',
    name: 'Lâmina',
    desc: 'Aço de acabamento metálico com runas gravadas',
    hotspot: '0 0.8 0.02',
    target: '0m 0.8m 0m',
    orbit: '25deg 80deg 1.9m'
  },
  {
    id: 'guard',
    name: 'Guarda',
    desc: 'Metal envelhecido com anel lateral',
    hotspot: '0 0.285 0.05',
    target: '0m 0.285m 0m',
    orbit: '35deg 75deg 0.5m'
  },
  {
    id: 'grip',
    name: 'Empunhadura',
    desc: 'Revestimento escuro trançado',
    hotspot: '0 0.17 0.035',
    target: '0m 0.17m 0m',
    orbit: '30deg 80deg 0.6m'
  },
  {
    id: 'pommel',
    name: 'Pomo',
    desc: 'Detalhamento inspirado no Lobo',
    hotspot: '0 0.03 0.05',
    target: '0m 0.03m 0m',
    orbit: '40deg 75deg 0.3m'
  }
];

const OVERVIEW = { target: '0m 0.64m 0m', orbit: '25deg 78deg 2.6m' };

export default function ModelSection() {
  const sectionRef = useRef(null);
  const viewerRef = useRef(null);

  const [viewerReady, setViewerReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [activePart, setActivePart] = useState(null);

  // O pacote do model-viewer carrega three.js junto: só vale baixá-lo quando a
  // seção se aproxima, para não disputar banda com o vídeo de abertura.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        import('@google/model-viewer')
          .then(() => setViewerReady(true))
          .catch(() => setViewerReady(false));
      },
      { rootMargin: '300px' }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // O evento `load` do model-viewer é próprio do custom element, então é ligado
  // na mão: depender de um `onLoad` em JSX deixaria a lista de peças travada
  // caso o React não o registrasse.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewerReady || !viewer) return;

    const onLoad = () => setModelLoaded(true);
    viewer.addEventListener('load', onLoad);
    if (viewer.loaded) onLoad();

    return () => viewer.removeEventListener('load', onLoad);
  }, [viewerReady]);

  const focusPart = useCallback((part) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const next = activePart === part.id ? null : part;
    viewer.cameraTarget = next ? next.target : OVERVIEW.target;
    viewer.cameraOrbit = next ? next.orbit : OVERVIEW.orbit;
    // Girar sozinho enquanto alguém inspeciona uma peça atrapalha.
    viewer.autoRotate = !next;
    setActivePart(next ? next.id : null);
  }, [activePart]);

  const autoRotate =
    typeof window !== 'undefined' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <section
      ref={sectionRef}
      id="modelo-3d"
      style={{ padding: '120px 5%', backgroundColor: 'var(--bg-dark)' }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '16px', fontSize: '2rem' }}>MODELO 3D</h2>
      <p style={{
        textAlign: 'center', marginBottom: '80px', fontSize: '0.8rem',
        letterSpacing: '2px', color: 'var(--text-muted)'
      }}>
        ARRASTE PARA GIRAR · SELECIONE UMA PEÇA PARA APROXIMAR
      </p>

      <div className="model-layout">
        <div className="model-stage">
          <img
            className="model-poster"
            src={heroTilt}
            alt="Espada de prata em vista inclinada"
            width={188}
            height={1400}
            loading="lazy"
            decoding="async"
            style={{ opacity: modelLoaded ? 0 : 1 }}
          />

          {viewerReady && (
            <model-viewer
              ref={viewerRef}
              src={swordModel}
              alt="Modelo 3D da espada de prata"
              camera-controls=""
              touch-action="pan-y"
              interaction-prompt="none"
              {...(autoRotate ? { 'auto-rotate': '' } : {})}
              auto-rotate-delay="1500"
              rotation-per-second="18deg"
              camera-target={OVERVIEW.target}
              camera-orbit={OVERVIEW.orbit}
              field-of-view="30deg"
              min-camera-orbit="auto auto 0.2m"
              max-camera-orbit="auto auto 5m"
              environment-image="neutral"
              tone-mapping="neutral"
              exposure="1"
              shadow-intensity="0.8"
              shadow-softness="0.9"
              style={{ opacity: modelLoaded ? 1 : 0, transition: 'opacity 0.8s ease' }}
            >
              {PARTS.map((part) => (
                <button
                  key={part.id}
                  className={`hotspot${activePart === part.id ? ' is-active' : ''}`}
                  slot={`hotspot-${part.id}`}
                  data-position={part.hotspot}
                  data-normal="0 0 1"
                  data-visibility-attribute="visible"
                  onClick={() => focusPart(part)}
                >
                  <span className="hotspot-label">{part.name.toUpperCase()}</span>
                </button>
              ))}
            </model-viewer>
          )}
        </div>

        <div className="part-list">
          {PARTS.map((part) => (
            <button
              key={part.id}
              type="button"
              className={activePart === part.id ? 'is-active' : ''}
              onClick={() => focusPart(part)}
              disabled={!modelLoaded}
            >
              <span className="part-name">{part.name}</span>
              <span className="part-desc">{part.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
