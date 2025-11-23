
import React from 'react';
import { FileText, Smartphone, ShieldCheck, Printer, ArrowRight, Zap } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* HERO SECTION */}
      <div className="bg-white pb-12 pt-8 px-4 rounded-b-[2.5rem] shadow-sm border-b border-slate-100">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full mb-2">
            <Zap size={14} className="fill-blue-700" /> Servizio Gratuito
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Il modulo patente <br />
            <span className="text-blue-600">sul tuo smartphone.</span>
          </h1>
          
          <p className="text-lg text-slate-500 leading-relaxed">
            Compila il modello <span className="font-semibold text-slate-700">TT2112</span> per la Motorizzazione Civile direttamente online. Niente carta, niente errori.
          </p>

          <div className="pt-4">
            <button 
              onClick={onStart}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 transition-all transform active:scale-95 flex items-center justify-center gap-3"
            >
              INIZIA COMPILAZIONE <ArrowRight size={20} />
            </button>
            <p className="text-xs text-slate-400 mt-3">
              Non serve registrazione. Ci vogliono solo 2 minuti.
            </p>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="flex-1 px-4 py-12 max-w-md mx-auto w-full space-y-10">
        
        {/* Step 1 */}
        <div className="flex gap-4">
          <div className="shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <Smartphone size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">Mobile Friendly</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Ottimizzato per essere compilato facilmente dal telefono mentre sei in fila o a casa.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4">
          <div className="shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">PDF Ufficiale</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Generiamo il modello TT2112 ministeriale perfettamente impaginato e leggibile.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4">
          <div className="shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">Privacy Totale</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              I tuoi dati non vengono salvati su nessun server. Tutto avviene nel tuo browser.
            </p>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="bg-white border-t border-slate-100 p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-2">
            <Printer size={16} />
            <span>Ricordati di stampare il PDF finale</span>
        </div>
        <p className="text-xs text-slate-300">
            &copy; {new Date().getFullYear()} TT2112 Digitale
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
