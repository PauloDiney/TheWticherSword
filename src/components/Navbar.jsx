import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';

// Rótulo e âncora explícitos: derivar o href do rótulo gerava "#especificações",
// com acento e cedilha, que nunca casou com o id "especificacoes" da seção.
const LINKS = [
  { label: 'MODELO', href: '#modelo' },
  { label: 'DETALHES', href: '#detalhes' },
  { label: 'ESPECIFICAÇÕES', href: '#especificacoes' },
  { label: 'MODELO 3D', href: '#modelo-3d' },
  { label: 'GALERIA', href: '#galeria' }
];

const MOBILE_QUERY = '(max-width: 1024px)';

const lockScroll = () => {
  const gap = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-gap', `${gap}px`);
  document.body.classList.add('menu-open');
};

const unlockScroll = () => {
  document.body.classList.remove('menu-open');
  document.documentElement.style.removeProperty('--scrollbar-gap');
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const toggleRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!open) return;

    lockScroll();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    // Voltar para o desktop com o menu aberto deixaria o painel preso na tela.
    const media = window.matchMedia(MOBILE_QUERY);
    const onChange = (event) => {
      if (!event.matches) setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    media.addEventListener('change', onChange);

    panelRef.current?.querySelector('a')?.focus({ preventScroll: true });

    return () => {
      unlockScroll();
      window.removeEventListener('keydown', onKeyDown);
      media.removeEventListener('change', onChange);
    };
  }, [open]);

  // A navegação por âncora acontece logo após o clique, antes de o React rodar
  // a limpeza do efeito — então a rolagem é destravada aqui, na mão.
  const closeAfterNavigation = useCallback(() => {
    unlockScroll();
    setOpen(false);
    toggleRef.current?.focus({ preventScroll: true });
  }, []);

  // Com o menu aberto o painel já é praticamente opaco: manter o fundo e o blur
  // da navbar só criaria uma faixa mais clara no topo.
  const plain = scrolled && !open;

  return (
    <>
      <nav
        className="nav-bar"
        style={{
          background: plain ? 'rgba(5, 5, 5, 0.8)' : 'transparent',
          backdropFilter: plain ? 'blur(12px)' : 'none',
          borderBottomColor: plain ? 'rgba(255,255,255,0.05)' : 'transparent'
        }}
      >
        <div className="nav-logo">THE SILVER BLADE</div>

        {/* Menu horizontal — acima de 1024px */}
        <div className="nav-links">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>

        {/* Hambúrguer — até 1024px */}
        <button
          ref={toggleRef}
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="nav-panel"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => (open ? closeAfterNavigation() : setOpen(true))}
        >
          {open ? <X size={24} strokeWidth={1} /> : <Menu size={24} strokeWidth={1} />}
        </button>
      </nav>

      {/* Fica FORA do <nav> de propósito: quando a página é rolada a navbar ganha
          `backdrop-filter`, e um elemento filtrado vira o containing block dos
          descendentes `position: fixed`. Dentro dela, o painel se encolhia para a
          faixa da navbar em vez de cobrir a viewport. */}
      <div
        ref={panelRef}
        id="nav-panel"
        className={`nav-panel${open ? ' is-open' : ''}`}
      >
        {LINKS.map((link, i) => (
          <a
            key={link.href}
            href={link.href}
            onClick={closeAfterNavigation}
            // Entrada escalonada, seguindo a ordem da lista
            style={{ transitionDelay: open ? `${80 + i * 50}ms` : '0ms' }}
          >
            {link.label}
          </a>
        ))}
      </div>
    </>
  );
}
