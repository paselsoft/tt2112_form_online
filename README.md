# 📝 TT2112 Digitale

**Compilazione assistita del modulo TT2112 per richiesta patente di guida**

Applicazione web moderna per compilare digitalmente il modulo ministeriale TT2112 con generazione automatica di PDF pronto per la stampa e invio email integrato.

[![Deploy on Cloud Run](https://img.shields.io/badge/Deploy-Cloud%20Run-4285F4?logo=google-cloud)](DEPLOY.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen.svg)](https://nodejs.org)

---

## ✨ Caratteristiche

- 🎯 **Form intelligente** - Validazione real-time con messaggi di errore chiari
- 📄 **Generazione PDF** - Compilazione automatica del modulo ufficiale TT2112
- 📧 **Invio email** - Invio diretto al Ministero delle Infrastrutture
- 📱 **Mobile-first** - Ottimizzato per smartphone e tablet
- 🔒 **Privacy-first** - Elaborazione client-side, nessun salvataggio server
- 🚀 **Performance** - Caching intelligente, template locale
- 🏢 **Proxy-friendly** - Funziona anche dietro proxy aziendali

---

## 🚀 Quick Start

### Sviluppo Locale

```bash
# 1. Clona repository
git clone https://github.com/paselsoft/tt2112_form_online.git
cd tt2112_form_online

# 2. Installa dipendenze
npm install

# 3. Configura variabili d'ambiente (opzionale per email)
cp .env.example .env.local
# Modifica .env.local con le tue credenziali SMTP

# 4. Avvia dev server
npm run dev
```

Apri http://localhost:5173

### Produzione

```bash
# Build
npm run build

# Avvia server Express
npm start
```

Apri http://localhost:8080

---

## 🌐 Deploy su Cloud Run

**Deploy automatico in 3 comandi:**

```bash
# 1. Configura variabili
export GCP_PROJECT_ID=your-project-id
export EMAIL_USER=your-email@gmail.com
export EMAIL_PASS=your-app-password

# 2. Esegui deploy
./deploy.sh

# 3. Apri app
# URL mostrato al termine del deploy
```

📚 **Guida completa:** [DEPLOY.md](DEPLOY.md)

---

## 📦 Stack Tecnologico

### Frontend
- **React 18.3** - UI framework
- **TypeScript 5.5** - Type safety
- **Vite 5.3** - Build tool ultra-veloce
- **Tailwind CSS** - Utility-first styling
- **pdf-lib 1.17** - Manipolazione PDF client-side
- **Lucide React** - Icone moderne

### Backend
- **Node.js 20** - Runtime
- **Express 4.19** - Web server
- **Nodemailer 6.9** - Email SMTP
- **Multer 1.4** - File upload

### Infrastructure
- **Google Cloud Run** - Serverless deployment
- **Docker** - Containerization
- **Cloud Build** - CI/CD

---

## 📁 Struttura Progetto

```
tt2112_form_online/
├── components/
│   ├── LandingPage.tsx      # Pagina onboarding
│   └── TT2112Form.tsx        # Form principale (807 LOC)
├── services/
│   ├── pdfService.ts         # Logica generazione PDF
│   └── embeddedTemplate.ts   # Configurazione template
├── public/
│   └── tt2112-template.pdf   # Template ufficiale TT2112
├── App.tsx                   # Router principale
├── server.js                 # Backend Express
├── types.ts                  # Definizioni TypeScript
├── Dockerfile                # Container configuration
├── deploy.sh                 # Script deploy automatico
└── DEPLOY.md                 # Guida deploy completa
```

---

## 🎯 Come Funziona

### 1. Caricamento Template
```
1. Tentativo da Cloud Run (/tt2112-template.pdf)
   ↓ (bypassa proxy aziendali)
2. Fallback GitHub (se Cloud Run fallisce)
   ↓
3. Cache LocalStorage (successivi caricamenti)
```

### 2. Compilazione Form
- Validazione real-time (CF, email, CAP, province, etc.)
- Auto-fill per testing rapido
- Supporto mobile touch-friendly

### 3. Generazione PDF
- Caricamento template (8 pagine)
- Compilazione campi con coordinate precise (mm)
- Sistema calibrazione per offset stampante
- Debug mode per troubleshooting

### 4. Invio Email
- Upload PDF compilato
- Invio SMTP a `paolo.selvaggini@mit.gov.it`
- Include dati contatto richiedente

---

## 🔧 Configurazione

### Variabili d'Ambiente

Crea `.env.local`:

```bash
# Email SMTP (richiesto per invio)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="TT2112 Digitale <noreply@tt2112.it>"

# Google Cloud (solo per deploy)
GCP_PROJECT_ID=your-project-id

# Server (opzionale)
PORT=8080
NODE_ENV=production
```

### Gmail App Password

1. Vai su https://myaccount.google.com/apppasswords
2. Seleziona "Posta" → "Altro"
3. Copia password generata (16 caratteri)
4. Usa in `EMAIL_PASS`

---

## 🧪 Testing

### Test Locale

```bash
# Run tests
npm test

# Build verificato
npm run build
ls -lh dist/tt2112-template.pdf  # Deve essere ~1.2MB
```

### Test Produzione

```bash
# Health check
curl -I https://your-app.run.app/

# Test PDF template
curl -I https://your-app.run.app/tt2112-template.pdf

# Download PDF test
curl https://your-app.run.app/tt2112-template.pdf -o test.pdf
file test.pdf  # Deve essere: PDF document, version 1.7
```

---

## 📊 Performance

### Metriche

| Metrica | Valore | Target |
|---------|--------|--------|
| **First Load** | ~200ms | < 500ms |
| **PDF Load (cache)** | ~5ms | < 50ms |
| **PDF Load (network)** | ~400ms | < 1s |
| **PDF Generation** | ~800ms | < 2s |
| **Bundle Size** | ~234KB (gzip) | < 500KB |

### Ottimizzazioni

- ✅ React.memo su InputField
- ✅ useCallback per handlers
- ✅ Chunked base64 encoding (32KB)
- ✅ Template caching (localStorage)
- ✅ Lazy loading componenti

---

## 🔒 Sicurezza

### Privacy
- ✅ Client-side processing (no server storage)
- ✅ LocalStorage solo per template PDF
- ✅ No cookies, no tracking, no analytics
- ✅ GDPR compliant

### Backend
- ✅ Environment variables per secrets
- ✅ File type validation (solo PDF)
- ✅ Memory storage (no disk writes)
- ✅ CORS configurato per proxy

### Best Practices
- ✅ Non-root Docker user
- ✅ Health checks configurati
- ✅ Input sanitization
- ✅ Secure headers (X-Content-Type-Options, etc.)

---

## 💰 Costi Cloud Run

**Stima mensile:**

| Utenti/mese | Richieste | Costo stimato |
|-------------|-----------|---------------|
| 1,000 | ~10K | $0 (Free Tier) |
| 10,000 | ~100K | ~$5-10 |
| 100,000 | ~1M | ~$50-80 |

**Free Tier include:**
- 2M richieste/mese
- 360K GiB-sec memory
- 180K vCPU-sec
- 1 GB egress

---

## 🐛 Troubleshooting

### PDF non caricato

```bash
# Verifica presenza
ls -lh public/tt2112-template.pdf

# Rebuild
npm run build
ls -lh dist/tt2112-template.pdf
```

### Email non inviate

```bash
# Test SMTP
node -e "
const nodemailer = require('nodemailer');
const t = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'USER', pass: 'PASS' }
});
t.verify().then(console.log).catch(console.error);
"
```

### Logs Cloud Run

```bash
gcloud run services logs read tt2112-digitale \
  --region europe-west1 \
  --limit 50
```

---

## 🤝 Contribuire

1. Fork il progetto
2. Crea branch (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'feat: Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

---

## 📄 Licenza

MIT License - vedi [LICENSE](LICENSE)

---

## 👥 Autori

- **Paolo Selvaggini** - *Ministero delle Infrastrutture e dei Trasporti*

---

## 🙏 Riconoscimenti

- Modulo TT2112 ufficiale del Ministero delle Infrastrutture
- [pdf-lib](https://github.com/Hopding/pdf-lib) per manipolazione PDF
- [Tailwind CSS](https://tailwindcss.com) per lo styling
- [Lucide](https://lucide.dev) per le icone

---

## 📞 Supporto

- 📧 Email: paolo.selvaggini@mit.gov.it
- 🐛 Issues: [GitHub Issues](https://github.com/paselsoft/tt2112_form_online/issues)
- 📚 Docs: [DEPLOY.md](DEPLOY.md)

---

**Made with ❤️ for Italian citizens**
