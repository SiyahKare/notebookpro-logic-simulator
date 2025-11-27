
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AIAssistant from './components/AIAssistant';
import Home from './pages/Home';
import Service from './pages/Service';
import Cart from './pages/Cart';
import AdminDashboard from './pages/AdminDashboard';
import Checkout from './pages/Checkout';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';

const App: React.FC = () => {
  // Simple View Router
  const [currentView, setView] = useState<string>('home');

  const renderView = () => {
    switch (currentView) {
      case 'home': return <Home />;
      case 'service': return <Service />;
      case 'cart': return <Cart setView={setView} />; // Pass setView to Cart
      case 'checkout': return <Checkout setView={setView} />;
      case 'admin': return <AdminDashboard />;
      default: return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-red-100 selection:text-red-900">
      <Navbar currentView={currentView} setView={setView} />
      
      <main className="animate-in fade-in duration-300">
        {renderView()}
      </main>

      <AIAssistant />
      <CookieBanner />
      
      <Footer />
    </div>
  );
};

export default App;
