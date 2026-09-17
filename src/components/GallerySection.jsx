import React from 'react';
import { Maximize2 } from 'lucide-react';
import blade from '../assets/img/blade.webp';
import guard from '../assets/img/guard.webp';
import grip from '../assets/img/grip.webp';
import pommel from '../assets/img/pommel.webp';
import tip from '../assets/img/tip.webp';

// A lâmina ocupa o cartão largo: é o render mais alongado dos cinco.
const RENDERS = [
  { src: blade, label: 'LÂMINA', alt: 'Lâmina da espada com as runas gravadas', w: 1200, h: 830, wide: true },
  { src: guard, label: 'GUARDA', alt: 'Guarda em metal escuro com o anel lateral', w: 1200, h: 830 },
  { src: grip, label: 'EMPUNHADURA', alt: 'Empunhadura com revestimento trançado', w: 1200, h: 830 },
  { src: pommel, label: 'POMO', alt: 'Pomo com o detalhamento inspirado no Lobo', w: 1031, h: 900 },
  { src: tip, label: 'PONTA', alt: 'Ponta da lâmina em close', w: 1200, h: 750 }
];

export default function GallerySection() {
  return (
    <section id="galeria" style={{ padding: '120px 5%', backgroundColor: 'var(--bg-dark)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '80px', fontSize: '2rem' }}>GALERIA</h2>

      <div className="gallery-grid">
        {RENDERS.map((render) => (
          <figure
            key={render.label}
            className={`gallery-item${render.wide ? ' gallery-item--wide' : ''}`}
          >
            <img
              src={render.src}
              alt={render.alt}
              width={render.w}
              height={render.h}
              loading="lazy"
              decoding="async"
            />
            <figcaption className="gallery-label">{render.label}</figcaption>
            <div className="icon">
              <Maximize2 size={32} strokeWidth={1} />
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}
