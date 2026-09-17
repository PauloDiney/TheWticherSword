import React, { useEffect, useRef, useState } from 'react';

// Janela de cada cena, em fração do progresso do scroll (0 a 1):
// [entrada, opacidade cheia, início da saída, fim da saída].
// A última passa de 1 de propósito — com `fim = 1` a cena sumiria exatamente
// no fim do scroll, justo onde fica o botão.
const SCENES = [
  [0.00, 0.02, 0.10, 0.15],
  [0.15, 0.20, 0.28, 0.35],
  [0.35, 0.42, 0.52, 0.58],
  [0.58, 0.62, 0.72, 0.78],
  [0.78, 0.82, 1.01, 1.01]
];

// Só a cena final tem elemento clicável; as outras nunca devem capturar cliques.
const INTERACTIVE = [false, false, false, false, true];

const LERP = 0.12;          // suavização do scroll
const SNAP = 0.0008;        // abaixo disso, encosta no alvo e para o loop
const SEEK_INTERVAL = 1000 / 30;  // teto de buscas por segundo no vídeo
const MIN_SEEK_DELTA = 1 / 30;    // ignora diferenças menores que um frame
const STUCK_SEEK = 500;           // ms até considerar uma busca perdida

// fade in: entrada -> cheia, fade out: saída -> fim
const getOpacity = (progress, start, peakIn, peakOut, end) => {
  if (progress <= start || progress >= end) return 0;
  if (progress > peakIn && progress < peakOut) return 1;
  if (progress <= peakIn) return (progress - start) / (peakIn - start);
  return 1 - (progress - peakOut) / (end - peakOut);
};

export default function ScrollVideo() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  // Referências das cenas: o estilo é alterado direto no DOM, sem re-render.
  const scene1Ref = useRef(null);
  const scene2Ref = useRef(null);
  const scene3Ref = useRef(null);
  const scene4Ref = useRef(null);
  const scene5Ref = useRef(null);

  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    const scenes = [scene1Ref, scene2Ref, scene3Ref, scene4Ref, scene5Ref];
    const lastOpacity = scenes.map(() => -1);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lerp = reduceMotion ? 1 : LERP;

    let rafId = null;
    let visible = true;
    let targetProgress = 0;
    let currentProgress = 0;

    let duration = 0;
    let seeking = false;
    let lastSeekAt = 0;
    let lastSeekTarget = -1;

    const start = () => {
      if (rafId === null && visible) rafId = requestAnimationFrame(renderLoop);
    };

    const stop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    /**
     * Move o vídeo para a posição atual. Retorna true quando já está em sincronia
     * (ou quando não há o que fazer), false quando ainda falta alcançar o alvo.
     *
     * As três guardas abaixo são o que impede o travamento: sem elas o
     * `currentTime` era atribuído a cada frame, empilhando buscas que o
     * navegador nunca conseguia concluir.
     */
    const syncVideo = (now) => {
      if (!video || !duration) return true;

      const wanted = currentProgress * duration;
      if (Math.abs(wanted - lastSeekTarget) < MIN_SEEK_DELTA) return true;
      // Se o `seeked` se perder, a flag não pode prender o loop para sempre.
      if (seeking && now - lastSeekAt < STUCK_SEEK) return false;
      if (video.readyState < 2) return false;           // ainda sem dados
      if (now - lastSeekAt < SEEK_INTERVAL) return false; // teto de taxa

      lastSeekAt = now;
      lastSeekTarget = wanted;
      seeking = true;
      video.currentTime = wanted;
      return false;
    };

    const updateScenes = (progress) => {
      for (let i = 0; i < scenes.length; i++) {
        const el = scenes[i].current;
        if (!el) continue;

        const [a, b, c, d] = SCENES[i];
        const opacity = getOpacity(progress, a, b, c, d);
        if (Math.abs(opacity - lastOpacity[i]) < 0.001) continue;
        lastOpacity[i] = opacity;

        el.style.opacity = opacity;
        // Um overlay invisível cobre a tela inteira e não pode seguir
        // interceptando cliques.
        el.style.pointerEvents = INTERACTIVE[i] && opacity > 0.9 ? 'auto' : 'none';
        if (i === 1) el.style.transform = `translateY(${(1 - opacity) * 20}px)`;
      }
    };

    const renderLoop = (now) => {
      const delta = targetProgress - currentProgress;
      const settled = Math.abs(delta) < SNAP;
      currentProgress = settled ? targetProgress : currentProgress + delta * lerp;

      updateScenes(currentProgress);
      const inSync = syncVideo(now);

      // Com o scroll parado e o vídeo na posição, o loop se encerra em vez de
      // seguir rodando a 60fps por trás do resto da página.
      if (settled && inSync) {
        rafId = null;
        return;
      }
      rafId = requestAnimationFrame(renderLoop);
    };

    const handleScroll = () => {
      const { top, height } = container.getBoundingClientRect();
      const maxScroll = height - window.innerHeight;
      targetProgress = maxScroll > 0 ? Math.min(Math.max(-top / maxScroll, 0), 1) : 0;
      start();
    };

    const onSeeking = () => { seeking = true; };
    const onSeeked = () => { seeking = false; start(); };
    const onMetadata = () => {
      duration = video.duration;
      if (Number.isFinite(duration) && duration > 0) {
        setVideoReady(true);
        start();
      }
    };

    // O loop só roda enquanto a seção está na tela.
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) handleScroll();
        else stop();
      },
      { rootMargin: '100px' }
    );
    observer.observe(container);

    if (video) {
      video.addEventListener('seeking', onSeeking);
      video.addEventListener('seeked', onSeeked);
      video.addEventListener('loadedmetadata', onMetadata);
      if (video.readyState >= 1) onMetadata();
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll(); // posição inicial, sem esperar o primeiro scroll

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (video) {
        video.removeEventListener('seeking', onSeeking);
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('loadedmetadata', onMetadata);
      }
      stop();
    };
  }, []);

  const overlayStyle = {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    textAlign: 'center', pointerEvents: 'none', opacity: 0, padding: '0 5%'
  };

  return (
    // Altura generosa para dar espaço de scroll às cinco cenas (400vh)
    <div ref={containerRef} style={{ height: '400vh', position: 'relative', background: '#000' }} id="modelo">

      {/* Container sticky que prende o vídeo na tela */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden' }}>

        {/* VÍDEO PRINCIPAL — versão com o índice no início do arquivo (ver scripts/faststart.mjs) */}
        <video
          ref={videoRef}
          src="/sword-scroll.mp4"
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: videoReady ? 0.8 : 0,
            transition: 'opacity 1.2s ease'
          }}
        />

        {/* Gradiente escuro base */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(5,5,5,0.8) 100%)' }} />

        {/* CENA 01 — HERO (0% a 15%) */}
        <div ref={scene1Ref} style={{ ...overlayStyle }}>
          <p style={{ fontSize: '0.8rem', letterSpacing: '4px', color: 'var(--text-muted)', marginBottom: '16px' }}>UMA LÂMINA PARA AS SOMBRAS</p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', marginBottom: '24px' }}>ESPADA DE PRATA</h1>
          <p style={{ maxWidth: '500px', color: 'var(--text-muted)', lineHeight: 1.6 }}>Uma peça inspirada na lendária arma de Geralt de Rívia.</p>

          <div style={{ position: 'absolute', bottom: '10%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.7rem', letterSpacing: '2px', color: '#888' }}>SCROLL PARA EXPLORAR</span>
            <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, #888, transparent)' }} />
          </div>
        </div>

        {/* CENA 02 — REVELAÇÃO (15% a 35%) */}
        <div ref={scene2Ref} style={{ ...overlayStyle }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', maxWidth: '800px', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
            FORJADA PARA ENFRENTAR O IMPOSSÍVEL
          </h2>
        </div>

        {/* CENA 03 — DETALHES (35% a 58%) */}
        <div ref={scene3Ref} style={{ ...overlayStyle, alignItems: 'flex-start', justifyContent: 'center', paddingLeft: '10%', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.2rem', letterSpacing: '4px', marginBottom: '40px', color: 'var(--accent)' }}>DETALHES</h3>
          <div style={{ display: 'grid', gap: '32px' }}>
            {[
              { t: 'LÂMINA', d: 'Aço de acabamento metálico' },
              { t: 'GUARDA', d: 'Metal envelhecido' },
              { t: 'EMPUNHADURA', d: 'Revestimento escuro' },
              { t: 'POMO', d: 'Detalhamento inspirado no Lobo' }
            ].map((item, i) => (
              <div key={i} style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '4px' }}>{item.t}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CENA 04 — FRASE CINEMATOGRÁFICA (58% a 78%) */}
        <div ref={scene4Ref} style={{ ...overlayStyle, background: 'rgba(0,0,0,0.4)' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span style={{ color: 'var(--text-muted)' }}>O AÇO PARA OS HOMENS.</span>
            <span style={{ color: '#FFF' }}>A PRATA PARA OS MONSTROS.</span>
          </h2>
        </div>

        {/* CENA 05 — PRODUTO FINAL (78% a 100%) */}
        <div ref={scene5Ref} style={{ ...overlayStyle, alignItems: 'flex-end', justifyContent: 'center', paddingRight: '10%', textAlign: 'right' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', maxWidth: '500px', marginBottom: '16px', lineHeight: 1.2 }}>
            UM OBJETO FEITO PARA SER VISTO EM CADA DETALHE.
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px', letterSpacing: '1px' }}>Modelo 3D de alta definição.</p>
          <a href="#modelo-3d" className="btn-premium">EXPLORAR DETALHES</a>
        </div>

      </div>
    </div>
  );
}
