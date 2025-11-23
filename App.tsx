import React from 'react';
import TT2112Form from './components/TT2112Form';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      <div className="w-full px-4 py-6">
        <header className="text-center mb-8 max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                Servizi al Cittadino
            </h1>
            <p className="text-lg text-slate-600">
                Compilazione assistita Modello TT 2112
            </p>
        </header>
        
        <main className="w-full">
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