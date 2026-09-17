import React from 'react';
import fullFront from '../assets/img/full-front.webp';
import fullSide from '../assets/img/full-side.webp';
import fullDiagonal from '../assets/img/full-diagonal.webp';

const VIEWS = [
  { src: fullFront, label: 'FRENTE', alt: 'Espada vista de frente', w: 226, h: 1400 },
  { src: fullSide, label: 'LATERAL', alt: 'Espada vista de perfil', w: 83, h: 1400 },
  { src: fullDiagonal, label: 'DIAGONAL', alt: 'Espada vista em diagonal', w: 230, h: 1500 }
];

export default function AboutSection() {
  return (
    <section id="detalhes" style={{
      padding: '120px 5%',
      backgroundColor: 'var(--bg-dark)',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '80px',
      alignItems: 'center',
      minHeight: '80vh'
    }}>
      <div>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '32px', lineHeight: 1.2 }}>
          UMA LÂMINA.<br/>UMA HISTÓRIA.
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.8, maxWidth: '500px' }}>
          Cada elemento do modelo foi desenvolvido para preservar a presença de uma espada medieval, desde o acabamento metálico da lâmina até os detalhes da empunhadura e do pomo. O design captura a essência de um artefato lendário que atravessou séculos de batalhas.
        </p>
      </div>
      
      {/* Três vistas ortogonais: as proporções extremas viram o próprio motivo gráfico */}
      <div className="views-trio">
        {VIEWS.map((view) => (
          <figure key={view.label}>
            <img
              src={view.src}
              alt={view.alt}
              width={view.w}
              height={view.h}
              loading="lazy"
              decoding="async"
            />
            <figcaption>{view.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}