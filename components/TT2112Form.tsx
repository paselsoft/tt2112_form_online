import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TT2112Data, INITIAL_DATA, RequestType, Gender, ValidationErrors } from '../types';
import { generateTT2112PDF } from '../services/pdfService';
import { PDF_TEMPLATE_URL } from '../services/embeddedTemplate';
import { Download, User, MapPin, FileText, Bug, FileUp, Wand2, CheckCircle, Settings, Trash2, AlertCircle, Phone, Mail, Loader2, AlertTriangle, Send } from 'lucide-react';

// Optimized helper for base64 conversion to avoid stack overflow or UI freeze with large files
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const CHUNK_SIZE = 0x8000; // 32KB chunks
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    binary += String.fromCharCode.apply(
      null, 
      Array.from(bytes.subarray(i, Math.min(i + CHUNK_SIZE, len)))
    );
  }
  return window.btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

// Extracted and Memoized InputField component
interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  maxLength?: number;
  width?: string;
}

const InputField = React.memo<InputFieldProps>(({ 
  label, 
  name, 
  value, 
  error, 
  onChange, 
  placeholder, 
  maxLength, 
  width = "w-full" 
}) => (
  <div className={width}>
    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
      {label} {error && <span className="text-red-600 normal-case ml-1">({error})</span>}
    </label>
    <input
      type="text"
      name={name}
      value={value || ''}
      onChange={onChange}
      maxLength={maxLength}
      autoComplete="off"
      className={`w-full px-3 py-2.5 rounded-lg outline-none transition-all shadow-sm uppercase font-bold text-sm bg-white text-slate-800 placeholder-slate-300 ${
        error 
          ? 'border border-red-400 focus:ring-2 focus:ring-red-100' 
          : 'border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'
      }`}
      placeholder={placeholder}
    />
  </div>
));

const TT2112Form: React.FC = () => {
  const [formData, setFormData] = useState<TT2112Data>(INITIAL_DATA);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [pdfTemplate, setPdfTemplate] = useState<ArrayBuffer | null>(null);
  const [calibration, setCalibration] = useState({ x: 0, y: 0 });
  const [showCalibration, setShowCalibration] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [usingEmbedded, setUsingEmbedded] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Email sending states
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cache key versioning to handle template updates - BUMPED TO V25
  const CACHE_KEY = 'tt2112_template_v25';

  // Load template logic
  useEffect(() => {
    let isMounted = true;

    const loadTemplate = async () => {
        setFetchError(null);
        // 1. Check LocalStorage (Cache) first to save bandwidth
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const buffer = base64ToArrayBuffer(cached);
                if (isMounted) setPdfTemplate(buffer);
                return; 
            } catch (e) {
                console.error("Errore caricamento cache", e);
                localStorage.removeItem(CACHE_KEY);
            }
        }

        // 2. If no cache, check if URL is provided
        if (PDF_TEMPLATE_URL && PDF_TEMPLATE_URL.startsWith('http')) {
            if (isMounted) setIsLoadingTemplate(true);
            try {
                const response = await fetch(PDF_TEMPLATE_URL);
                if (!response.ok) {
                    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
                }
                
                const buffer = await response.arrayBuffer();
                
                if (isMounted) {
                    setPdfTemplate(buffer);
                    setUsingEmbedded(true); // Mark as "official" template
                }
                
                // Cache it for next time
                try {
                    const base64 = arrayBufferToBase64(buffer);
                    localStorage.setItem(CACHE_KEY, base64);
                } catch (e) {
                    console.warn("Could not cache downloaded PDF", e);
                }
            } catch (error: any) {
                console.error("Failed to fetch PDF from URL:", error);
                if (isMounted) setFetchError("Impossibile scaricare il modello automatico. Assicurati che il repository GitHub sia PUBBLICO.");
            } finally {
                if (isMounted) setIsLoadingTemplate(false);
            }
        }
    };

    loadTemplate();
    return () => { isMounted = false; };
  }, []);

  const validateField = useCallback((name: string, value: string): string => {
    switch (name) {
      case 'cognome':
      case 'nome':
      case 'luogoNascita':
      case 'cittadinanza':
      case 'residenzaComune':
      case 'residenzaVia':
        return value.trim().length < 2 ? 'Richiesto' : '';
      
      case 'codiceFiscale':
        const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
        return value && !cfRegex.test(value) ? 'Formato errato' : '';
      
      case 'dataNascita':
        // Simple check, stricter regex can be applied
        return value && !/^\d{2}\/\d{2}\/\d{4}$/.test(value) ? 'GG/MM/AAAA' : '';
      
      case 'provinciaNascita':
      case 'residenzaProvincia':
        return value && value.trim().length !== 2 ? '2 lettere' : '';
        
      case 'residenzaCap':
        return value && !/^\d{5}$/.test(value) ? '5 cifre' : '';

      case 'email':
        return value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Email non valida' : '';
      
      case 'telefono':
        return value && !/^[0-9\s+]+$/.test(value) ? 'Solo numeri' : '';

      default:
        return '';
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    setErrors(prev => ({
        ...prev,
        [name]: validateField(name, value)
    }));
  }, [validateField]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.type !== 'application/pdf') {
            alert("Per favore carica un file PDF.");
            return;
        }
        try {
            const arrayBuffer = await file.arrayBuffer();
            setPdfTemplate(arrayBuffer);
            setUsingEmbedded(false);
            setFetchError(null);
            
            // Save to LocalStorage
            try {
                const base64 = arrayBufferToBase64(arrayBuffer);
                localStorage.setItem(CACHE_KEY, base64);
            } catch (storageErr) {
                console.warn("Impossibile salvare in cache (file troppo grande?)", storageErr);
                alert("Nota: Il file è stato caricato ma è troppo grande per essere salvato in memoria per la prossima volta.");
            }

        } catch (err) {
            console.error("Error reading file", err);
            alert("Errore nella lettura del file.");
        }
    }
  };

  const handleResetTemplate = () => {
      if (confirm("Vuoi rimuovere il modello salvato e riprovare il download automatico?")) {
          setPdfTemplate(null);
          localStorage.removeItem(CACHE_KEY);
          setUsingEmbedded(false);
          setFetchError(null);
          window.location.reload();
      }
  };

  const handleFillRandomData = () => {
    const names = ["ALESSANDRO", "GIUSEPPE", "MARIA", "ANNA", "LUCA", "SOFIA"];
    const surnames = ["ROSSI", "RUSSO", "FERRARI", "ESPOSITO", "BIANCHI"];
    const cities = [
        { name: "ROMA", prov: "RM", cap: "00184" },
        { name: "MILANO", prov: "MI", cap: "20121" }, 
        { name: "NAPOLI", prov: "NA", cap: "80132" }
    ];
    
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomBirthCity = cities[Math.floor(Math.random() * cities.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const cfBase = (surname.substring(0,3) + name.substring(0,3)).padEnd(6, 'X').toUpperCase();
    const cf = `${cfBase}80A01H501U`; 

    setFormData({
        cognome: surname,
        nome: name,
        sesso: Math.random() > 0.5 ? Gender.M : Gender.F,
        luogoNascita: randomBirthCity.name,
        provinciaNascita: randomBirthCity.prov,
        dataNascita: "01/01/1980",
        statoNascita: "ITALIA",
        cittadinanza: "ITALIANA",
        codiceFiscale: cf,
        residenzaComune: randomCity.name,
        residenzaProvincia: randomCity.prov,
        residenzaVia: "VIA GARIBALDI",
        residenzaNumero: Math.floor(Math.random() * 100 + 1).toString(),
        residenzaCap: randomCity.cap,
        tipoRichiesta: RequestType.CONSEGUIMENTO,
        categoriaRichiesta: "B",
        categoriaPosseduta: "",
        daCategoria: "",
        aCategoria: "",
        estremiPatente: "",
        telefono: "3331234567",
        email: `${name.toLowerCase()}.${surname.toLowerCase()}@email.it`
    });
    setErrors({});
  };

  const handleDownload = async () => {
    if (!pdfTemplate) {
        alert("Carica prima il modello PDF.");
        return;
    }
    try {
        const filledPdfBytes = await generateTT2112PDF(formData, pdfTemplate, { 
            xOffset: Number(calibration.x), 
            yOffset: Number(calibration.y),
            showDebug: debugMode
        });
        const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `TT2112_${formData.cognome || 'COMPILATO'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        alert("Errore download: " + err);
    }
  };

  const handleSendEmail = async () => {
      if (!pdfTemplate) {
          alert("Attendi il caricamento del modello.");
          return;
      }
      if (!formData.cognome || !formData.nome) {
          alert("Per favore compila almeno Cognome e Nome.");
          return;
      }

      setIsSendingEmail(true);
      setEmailStatus('idle');
      setEmailMessage('');

      try {
          const filledPdfBytes = await generateTT2112PDF(formData, pdfTemplate, { 
              xOffset: Number(calibration.x), 
              yOffset: Number(calibration.y),
              showDebug: false
          });
          
          const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
          const formDataToSend = new FormData();
          formDataToSend.append('pdf', blob, `TT2112_${formData.cognome}.pdf`);
          formDataToSend.append('nome', formData.nome);
          formDataToSend.append('cognome', formData.cognome);
          if (formData.email) formDataToSend.append('emailUtente', formData.email);
          if (formData.telefono) formDataToSend.append('telefono', formData.telefono);

          const response = await fetch('/api/send-email', {
              method: 'POST',
              body: formDataToSend
          });

          // Check for JSON content type
          const contentType = response.headers.get("content-type");
          
          if (contentType && contentType.indexOf("application/json") !== -1) {
             const result = await response.json();
             if (!response.ok) {
                 throw new Error(result.error || "Errore sconosciuto dal server");
             }
             setEmailStatus('success');
             setEmailMessage("Pratica inviata correttamente all'ufficio!");
          } else {
             // Response is not JSON (likely HTML 404/500 from static host)
             console.error("Non-JSON response received:", await response.text());
             throw new Error("Il server non è raggiungibile (Endpoint API non trovato). Se sei su un hosting statico, questa funzione non è disponibile.");
          }

      } catch (err: any) {
          console.error(err);
          setEmailStatus('error');
          setEmailMessage("Errore invio: " + err.message);
      } finally {
          setIsSendingEmail(false);
      }
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      
      {/* MAIN FORM CARD */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            
            {/* Header Actions */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <FileText size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold leading-tight">Dati Modulo</h2>
                        <p className="text-xs text-slate-400 hidden sm:block">Compila i campi sottostanti</p>
                    </div>
                </div>
                <button 
                    onClick={handleFillRandomData}
                    className="text-xs font-medium px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors flex items-center gap-2"
                >
                    <Wand2 size={14} />
                    <span>Auto</span>
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-8">
                
                {/* UPLOAD / LOADING SECTION */}
                {!pdfTemplate ? (
                    <div className={`p-6 rounded-xl border-2 border-dashed ${fetchError ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50'} text-center relative overflow-hidden transition-colors`}>
                        {isLoadingTemplate && (
                            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                                <Loader2 size={32} className="text-blue-600 animate-spin mb-2" />
                                <span className="text-sm font-bold text-blue-800">Scaricamento Modello...</span>
                            </div>
                        )}
                        
                        <div className="mb-3 flex justify-center">
                            <div className={`p-3 rounded-full ${fetchError ? 'bg-red-100' : 'bg-blue-100'}`}>
                                {fetchError ? <AlertTriangle size={24} className="text-red-600" /> : <FileUp size={24} className="text-blue-600" />}
                            </div>
                        </div>
                        <h3 className="text-sm font-bold text-blue-900 mb-1">
                            {fetchError ? 'Errore Scaricamento' : 'Carica Modello TT2112'}
                        </h3>
                        <p className={`text-xs ${fetchError ? 'text-red-700' : 'text-blue-700'} mb-4 px-8`}>
                            {fetchError 
                                ? fetchError 
                                : (PDF_TEMPLATE_URL 
                                    ? "Download automatico in corso..." 
                                    : "Carica il PDF vuoto del modello TT2112.")}
                        </p>
                        
                        <input 
                            type="file" 
                            accept="application/pdf"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                        >
                            Carica Manualmente PDF
                        </button>
                    </div>
                ) : (
                    <div className="p-4 rounded-xl border border-green-200 bg-green-50 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-full">
                                <CheckCircle size={18} className="text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-green-900">Modello Pronto</h3>
                                <p className="text-xs text-green-700">
                                    {usingEmbedded ? 'Modello ufficiale scaricato.' : 'Modello caricato dalla memoria locale.'}
                                </p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleResetTemplate}
                            className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <Trash2 size={12} /> Reset
                        </button>
                    </div>
                )}

                {/* FORM FIELDS */}
                <div className={!pdfTemplate ? 'opacity-40 pointer-events-none grayscale transition-all duration-300' : 'transition-all duration-300'}>
                    
                    {/* Section 1 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                            <User size={16} /> Dati Anagrafici
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField 
                              label="Cognome" 
                              name="cognome" 
                              value={formData.cognome} 
                              error={errors.cognome} 
                              onChange={handleChange} 
                              placeholder="ROSSI" 
                            />
                            <InputField 
                              label="Nome" 
                              name="nome" 
                              value={formData.nome} 
                              error={errors.nome} 
                              onChange={handleChange} 
                              placeholder="MARIO" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sesso</label>
                                <select
                                    name="sesso"
                                    value={formData.sesso}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                                >
                                    <option value={Gender.M}>M</option>
                                    <option value={Gender.F}>F</option>
                                </select>
                             </div>
                             <InputField 
                                label="Data Nascita" 
                                name="dataNascita" 
                                value={formData.dataNascita} 
                                error={errors.dataNascita} 
                                onChange={handleChange} 
                                placeholder="GG/MM/AAAA" 
                                maxLength={10} 
                             />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <InputField 
                                  label="Comune Nascita" 
                                  name="luogoNascita" 
                                  value={formData.luogoNascita} 
                                  error={errors.luogoNascita} 
                                  onChange={handleChange} 
                                />
                            </div>
                            <InputField 
                              label="Prov." 
                              name="provinciaNascita" 
                              value={formData.provinciaNascita} 
                              error={errors.provinciaNascita} 
                              onChange={handleChange} 
                              maxLength={2} 
                            />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <InputField 
                              label="Stato Nascita" 
                              name="statoNascita" 
                              value={formData.statoNascita} 
                              error={errors.statoNascita} 
                              onChange={handleChange} 
                            />
                            <InputField 
                              label="Cittadinanza" 
                              name="cittadinanza" 
                              value={formData.cittadinanza} 
                              error={errors.cittadinanza} 
                              onChange={handleChange} 
                            />
                        </div>
                        <InputField 
                          label="Codice Fiscale" 
                          name="codiceFiscale" 
                          value={formData.codiceFiscale} 
                          error={errors.codiceFiscale} 
                          onChange={handleChange} 
                          maxLength={16} 
                        />
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-4 mt-8">
                        <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                            <MapPin size={16} /> Residenza
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <InputField 
                                  label="Comune" 
                                  name="residenzaComune" 
                                  value={formData.residenzaComune} 
                                  error={errors.residenzaComune} 
                                  onChange={handleChange} 
                                />
                            </div>
                            <InputField 
                              label="Prov." 
                              name="residenzaProvincia" 
                              value={formData.residenzaProvincia} 
                              error={errors.residenzaProvincia} 
                              onChange={handleChange} 
                              maxLength={2} 
                            />
                        </div>
                        <div className="grid grid-cols-6 gap-3">
                            <div className="col-span-4">
                                <InputField 
                                  label="Indirizzo" 
                                  name="residenzaVia" 
                                  value={formData.residenzaVia} 
                                  error={errors.residenzaVia} 
                                  onChange={handleChange} 
                                  placeholder="VIA..." 
                                />
                            </div>
                            <div className="col-span-2">
                                <InputField 
                                  label="N." 
                                  name="residenzaNumero" 
                                  value={formData.residenzaNumero} 
                                  error={errors.residenzaNumero} 
                                  onChange={handleChange} 
                                />
                            </div>
                        </div>
                        <div className="w-1/2">
                            <InputField 
                              label="CAP" 
                              name="residenzaCap" 
                              value={formData.residenzaCap} 
                              error={errors.residenzaCap} 
                              onChange={handleChange} 
                              maxLength={5} 
                            />
                        </div>
                    </div>

                    {/* Section Recapiti */}
                    <div className="space-y-4 mt-8">
                        <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                            <Phone size={16} /> Recapiti
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative">
                                <InputField 
                                  label="Telefono" 
                                  name="telefono" 
                                  value={formData.telefono || ''} 
                                  error={errors.telefono} 
                                  onChange={handleChange} 
                                  placeholder="333..." 
                                  maxLength={15} 
                                />
                            </div>
                            <div className="relative">
                                <InputField 
                                  label="Email" 
                                  name="email" 
                                  value={formData.email || ''} 
                                  error={errors.email} 
                                  onChange={handleChange} 
                                  placeholder="esempio@email.com" 
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                            * Verranno stampati a piè di pagina 2, 4 e 6 sotto il riquadro Note.
                        </p>
                    </div>

                     {/* Section 3 */}
                    <div className="space-y-4 mt-8">
                        <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                            <FileText size={16} /> Pratica
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                            { id: RequestType.CONSEGUIMENTO, label: 'Conseguimento' },
                            { id: RequestType.DUPLICATO, label: 'Duplicato / Conversione' },
                            { id: RequestType.RICLASSIFICAZIONE, label: 'Riclassificazione' }
                            ].map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setFormData(prev => ({ ...prev, tipoRichiesta: type.id }))}
                                className={`px-4 py-3 rounded-lg text-left text-sm font-bold border transition-all ${
                                formData.tipoRichiesta === type.id
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {type.label}
                            </button>
                            ))}
                        </div>
                        
                        {formData.tipoRichiesta !== RequestType.NONE && (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 animate-in fade-in">
                                {formData.tipoRichiesta === RequestType.CONSEGUIMENTO && (
                                    <InputField 
                                      label="Categoria" 
                                      name="categoriaRichiesta" 
                                      value={formData.categoriaRichiesta} 
                                      error={errors.categoriaRichiesta} 
                                      onChange={handleChange} 
                                      placeholder="B" 
                                    />
                                )}
                                {formData.tipoRichiesta === RequestType.DUPLICATO && (
                                    <>
                                        <InputField 
                                          label="Categoria Posseduta" 
                                          name="categoriaPosseduta" 
                                          value={formData.categoriaPosseduta} 
                                          error={errors.categoriaPosseduta} 
                                          onChange={handleChange} 
                                        />
                                        <InputField 
                                          label="Numero Patente" 
                                          name="estremiPatente" 
                                          value={formData.estremiPatente} 
                                          error={errors.estremiPatente} 
                                          onChange={handleChange} 
                                        />
                                    </>
                                )}
                                {formData.tipoRichiesta === RequestType.RICLASSIFICAZIONE && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <InputField 
                                              label="Da Cat." 
                                              name="daCategoria" 
                                              value={formData.daCategoria} 
                                              error={errors.daCategoria} 
                                              onChange={handleChange} 
                                            />
                                            <InputField 
                                              label="A Cat." 
                                              name="aCategoria" 
                                              value={formData.aCategoria} 
                                              error={errors.aCategoria} 
                                              onChange={handleChange} 
                                            />
                                        </div>
                                        <InputField 
                                          label="Numero Patente" 
                                          name="estremiPatente" 
                                          value={formData.estremiPatente} 
                                          error={errors.estremiPatente} 
                                          onChange={handleChange} 
                                        />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

             {/* Footer Controls */}
             <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-3">
                 <button 
                    onClick={() => setShowCalibration(!showCalibration)}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
                 >
                    <Settings size={14} /> {showCalibration ? 'Chiudi Calibrazione' : 'Impostazioni di Stampa & Calibrazione'}
                 </button>

                 {showCalibration && (
                     <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                <Bug size={14} /> Mostra Coordinate (Debug)
                            </span>
                            <button 
                                onClick={() => setDebugMode(!debugMode)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${debugMode ? 'bg-red-500' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${debugMode ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded text-[10px] text-yellow-800 mb-2 border border-yellow-200 flex gap-2 items-start">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <span>Poiché non hai l'anteprima a destra, scarica il PDF per verificare le coordinate di debug stampate in rosso.</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">X Offset (mm)</label>
                                <input type="number" value={calibration.x} onChange={(e) => setCalibration(p => ({...p, x: Number(e.target.value)}))} className="w-full text-center border rounded p-1 text-sm bg-white" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Y Offset (mm)</label>
                                <input type="number" value={calibration.y} onChange={(e) => setCalibration(p => ({...p, y: Number(e.target.value)}))} className="w-full text-center border rounded p-1 text-sm bg-white" />
                            </div>
                        </div>
                     </div>
                 )}
                
                 {/* ACTION BUTTONS */}
                 <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleDownload}
                        disabled={!pdfTemplate || isSendingEmail}
                        className={`py-3.5 rounded-xl font-bold shadow-lg text-sm transition-all flex items-center justify-center gap-2 ${
                            pdfTemplate && !isSendingEmail
                            ? 'bg-white border-2 border-blue-600 text-blue-700 hover:bg-blue-50' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-transparent'
                        }`}
                    >
                        {isLoadingTemplate ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        {isLoadingTemplate ? 'CARICAMENTO...' : 'SCARICA PDF'}
                    </button>

                    <button
                        onClick={handleSendEmail}
                        disabled={!pdfTemplate || isSendingEmail}
                        className={`py-3.5 rounded-xl font-bold shadow-lg text-sm transition-all flex items-center justify-center gap-2 ${
                            pdfTemplate && !isSendingEmail
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {isSendingEmail ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {isSendingEmail ? 'INVIO...' : 'INVIA AL MIT'}
                    </button>
                 </div>

                 {/* EMAIL STATUS FEEDBACK */}
                 {emailStatus === 'success' && (
                     <div className="p-3 bg-green-100 text-green-800 text-xs font-bold rounded-lg flex items-center gap-2 border border-green-200 animate-in fade-in slide-in-from-bottom-2">
                         <CheckCircle size={16} /> {emailMessage}
                     </div>
                 )}
                 {emailStatus === 'error' && (
                     <div className="p-3 bg-red-100 text-red-800 text-xs font-bold rounded-lg flex items-center gap-2 border border-red-200 animate-in fade-in slide-in-from-bottom-2">
                         <AlertCircle size={16} /> {emailMessage}
                     </div>
                 )}

             </div>
      </div>
    </div>
  );
};

export default TT2112Form;