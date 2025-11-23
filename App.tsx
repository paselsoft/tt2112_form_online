
import React, { useState } from 'react';
import TT2112Form from './components/TT2112Form';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return <LandingPage onStart={() => setShowForm(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      <div className="w-full px-4 py-6">
        <header className="text-center mb-8 max-w-4xl mx-auto animate-in slide-in-from-top-4 fade-in duration-500">
            <button 
                onClick={() => setShowForm(false)}
                className="text-xs font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest mb-2 block"
            >
                ← Torna alla Home
            </button>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-1">
                Servizi al Cittadino
            </h1>
            <p className="text-lg text-slate-600">
                Compilazione assistita Modello TT 2112
            </p>
        </header>
        
        <main className="w-full animate-in slide-in-from-bottom-4 fade-in duration-500">
          <TT2112Form />
        </main>

        <footer className="mt-12 text-center text-slate-400 text-sm pb-8">
            <p>&copy; {new Date().getFullYear()} TT2112 Digitale. Sistema di compilazione indipendente.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
