import React from 'react';
import ctaBlade from '../assets/img/cta-vertical.webp';

export default function FinalSection() {
  return (
    <section style={{
      position: 'relative',
      height: '80vh',
      backgroundColor: 'var(--bg-darker)',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      textAlign: 'center', padding: '0 5%',
      overflow: 'hidden'
    }}>
      <img
        className="cta-blade"
        src={ctaBlade}
        alt=""
        aria-hidden="true"
        width={290}
        height={1600}
        loading="lazy"
        decoding="async"
      />

      <h2 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', marginBottom: '16px' }}>
        PRONTA PARA SER DESCOBERTA.
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '48px', letterSpacing: '2px' }}>
        Explore cada detalhe.
      </p>

      <a href="#modelo-3d" className="btn-premium">
        EXPLORAR MODELO 3D
      </a>
    </section>
  );
}
