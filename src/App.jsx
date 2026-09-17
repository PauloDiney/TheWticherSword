import React from 'react';
import Navbar from './components/Navbar';
import ScrollVideo from './components/ScrollVideo';
import AboutSection from './components/AboutSection';
import SpecsSection from './components/SpecsSection';
import ModelSection from './components/ModelSection';
import GallerySection from './components/GallerySection';
import FinalSection from './components/FinalSection';
import './styles.css';

function App() {
  return (
    <>
      <Navbar />
      <main>
        {/* A seção do vídeo controlará as Cenas 01 a 05 */}
        <ScrollVideo />
        <AboutSection />
        <SpecsSection />
        <ModelSection />
        <GallerySection />
        <FinalSection />
      </main>
    </>
  );
}

export default App;