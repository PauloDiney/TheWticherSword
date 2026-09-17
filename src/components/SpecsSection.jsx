import React from 'react';

export default function SpecsSection() {
  const specs = [
    { label: 'Comprimento total', value: '128 cm' },
    { label: 'Comprimento da lâmina', value: '97 cm' },
    { label: 'Material', value: 'Metal / aço' },
    { label: 'Modelagem', value: 'High Poly' },
    { label: 'Texturas', value: '4K' },
    { label: 'Materiais', value: 'PBR' },
    { label: 'Formato', value: '3D Asset' }
  ];

  return (
    <section id="especificacoes" style={{ padding: '120px 5%', backgroundColor: 'var(--bg-panel)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '80px', fontSize: '2rem' }}>ESPECIFICAÇÕES</h2>
      
      <div style={{ 
        maxWidth: '800px', margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' 
      }}>
        {specs.map((spec, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              {spec.label}
            </span>
            <span style={{ fontSize: '1.2rem', color: '#FFF', fontFamily: 'var(--font-title)' }}>
              {spec.value}
            </span>
            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', marginTop: '8px' }} />
          </div>
        ))}
      </div>
    </section>
  );
}