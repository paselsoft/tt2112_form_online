# 🚀 Guida Deploy su Google Cloud Run

Questa guida ti accompagna passo-passo nel deploy dell'applicazione TT2112 Digitale su Google Cloud Run.

---

## 📋 Prerequisiti

### 1. Account Google Cloud
- Crea un account su [Google Cloud Console](https://console.cloud.google.com)
- Attiva il piano **Free Tier** (include $300 di crediti gratuiti)
- Crea un nuovo progetto o usa uno esistente

### 2. Google Cloud SDK (gcloud)
**Installazione:**

**macOS:**
```bash
brew install google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Windows:**
- Download da [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

**Verifica installazione:**
```bash
gcloud --version
```

### 3. Autenticazione
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 4. Credenziali Email SMTP
Per l'invio email serve un account SMTP. **Consigliato: Gmail con App Password**

**Setup Gmail:**
1. Vai su [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Crea una "App Password" (seleziona "Posta" e "Altro")
3. Salva la password generata (16 caratteri)

---

## 🎯 Metodo 1: Deploy Automatico (Consigliato)

### Step 1: Configura variabili d'ambiente

```bash
# Copia template
cp .env.example .env.local

# Modifica con i tuoi valori
nano .env.local
```

**Valori richiesti:**
```bash
GCP_PROJECT_ID=your-project-id
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM="TT2112 Digitale <noreply@example.com>"
```

### Step 2: Esegui script di deploy

```bash
# Carica variabili
export $(cat .env.local | xargs)

# Esegui deploy
./deploy.sh
```

Lo script eseguirà automaticamente:
1. ✅ Build locale (verifica)
2. ✅ Abilita API necessarie
3. ✅ Build Docker image
4. ✅ Deploy su Cloud Run
5. ✅ Configura variabili d'ambiente
6. ✅ Mostra URL finale

**Tempo stimato:** 3-5 minuti

---

## 🛠️ Metodo 2: Deploy Manuale

### Step 1: Abilita API

```bash
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com
```

### Step 2: Build Docker image

```bash
# Sostituisci YOUR_PROJECT_ID con il tuo project ID
gcloud builds submit \
    --tag gcr.io/YOUR_PROJECT_ID/tt2112-digitale \
    --timeout=10m
```

### Step 3: Deploy su Cloud Run

```bash
gcloud run deploy tt2112-digitale \
    --image gcr.io/YOUR_PROJECT_ID/tt2112-digitale \
    --platform managed \
    --region europe-west1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 10 \
    --set-env-vars "EMAIL_HOST=smtp.gmail.com,EMAIL_USER=your@email.com,EMAIL_PASS=your-password,EMAIL_FROM=TT2112 <noreply@tt2112.it>"
```

### Step 4: Verifica deploy

```bash
# Ottieni URL del servizio
gcloud run services describe tt2112-digitale \
    --platform managed \
    --region europe-west1 \
    --format 'value(status.url)'
```

---

## 🔄 Metodo 3: Deploy con Cloud Build YAML

Per deploy automatizzati con CI/CD:

```bash
gcloud builds submit --config cloudbuild.yaml
```

Il file `cloudbuild.yaml` è già configurato nel repository.

---

## 🧪 Testing Post-Deploy

### 1. Test Applicazione Base
```bash
# Ottieni URL
SERVICE_URL=$(gcloud run services describe tt2112-digitale \
    --region europe-west1 \
    --format 'value(status.url)')

# Test HTTP
curl -I $SERVICE_URL

# Apri nel browser
open $SERVICE_URL  # macOS
xdg-open $SERVICE_URL  # Linux
```

### 2. Test Template PDF
```bash
# Verifica caricamento PDF
curl -I $SERVICE_URL/tt2112-template.pdf

# Download PDF
curl $SERVICE_URL/tt2112-template.pdf -o test-template.pdf

# Verifica dimensione (dovrebbe essere ~1.2MB)
ls -lh test-template.pdf
```

### 3. Test da Ufficio (Proxy)
1. Apri `$SERVICE_URL` dal PC ministeriale
2. Apri DevTools Console (F12)
3. Verifica log: "✓ Template caricato con successo da Cloud Run"
4. Compila form e scarica PDF

### 4. Test Email (Opzionale)
1. Compila form con dati validi
2. Clicca "INVIA AL MIT"
3. Verifica email inviata a `paolo.selvaggini@mit.gov.it`

---

## 📊 Monitoring e Logs

### Visualizza logs in tempo reale
```bash
gcloud run services logs read tt2112-digitale \
    --region europe-west1 \
    --limit 50 \
    --format "table(timestamp,severity,textPayload)"
```

### Tail logs (stream continuo)
```bash
gcloud run services logs tail tt2112-digitale \
    --region europe-west1
```

### Metriche Cloud Console
```bash
# Apri dashboard metriche
gcloud run services describe tt2112-digitale \
    --region europe-west1 \
    --format 'value(metadata.selfLink)' | \
    xargs -I {} open "https://console.cloud.google.com{}"
```

---

## 🔧 Operazioni Comuni

### Aggiornare variabili d'ambiente
```bash
gcloud run services update tt2112-digitale \
    --region europe-west1 \
    --update-env-vars EMAIL_USER=new@email.com,EMAIL_PASS=newpassword
```

### Aggiornare configurazione
```bash
# Aumenta memoria
gcloud run services update tt2112-digitale \
    --region europe-west1 \
    --memory 1Gi

# Cambia numero istanze
gcloud run services update tt2112-digitale \
    --region europe-west1 \
    --max-instances 20 \
    --min-instances 1
```

### Rollback a versione precedente
```bash
# Lista revisioni
gcloud run revisions list \
    --service tt2112-digitale \
    --region europe-west1

# Rollback
gcloud run services update-traffic tt2112-digitale \
    --region europe-west1 \
    --to-revisions REVISION_NAME=100
```

### Eliminare servizio
```bash
gcloud run services delete tt2112-digitale \
    --region europe-west1
```

---

## 💰 Costi Stimati

**Cloud Run Pricing (Free Tier incluso):**

| Risorsa | Free Tier/mese | Costo dopo Free Tier |
|---------|----------------|----------------------|
| **Richieste** | 2M richieste | $0.40/M richieste |
| **CPU** | 180,000 vCPU-sec | $0.00002400/vCPU-sec |
| **Memoria** | 360,000 GiB-sec | $0.00000250/GiB-sec |
| **Rete Egress** | 1 GB | $0.12/GB |

**Stima mensile per 1.000 utenti:**
- Richieste: ~10,000 (entro Free Tier)
- CPU/Memory: ~50,000 sec (entro Free Tier)
- Bandwidth: ~2 GB ($0.12)
- **Totale: ~$0.12/mese** ✨

**Stima mensile per 10.000 utenti:**
- ~$5-10/mese

---

## 🔒 Sicurezza Best Practices

### 1. Non committare secrets
```bash
# .gitignore già configurato per:
.env
.env.local
*.local
```

### 2. Usa Secret Manager (Production)
```bash
# Crea secret
echo -n "your-password" | gcloud secrets create email-password --data-file=-

# Deploy con secret
gcloud run deploy tt2112-digitale \
    --region europe-west1 \
    --update-secrets EMAIL_PASS=email-password:latest
```

### 3. Limita accesso
```bash
# Richiedi autenticazione
gcloud run services update tt2112-digitale \
    --region europe-west1 \
    --no-allow-unauthenticated
```

---

## 🐛 Troubleshooting

### Errore: "Permission denied"
```bash
# Aggiungi ruoli necessari
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="user:your@email.com" \
    --role="roles/run.admin"
```

### Errore: "API not enabled"
```bash
# Abilita tutte le API
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com
```

### Errore: "Container failed to start"
```bash
# Verifica logs
gcloud run services logs read tt2112-digitale --region europe-west1 --limit 100

# Verifica variabili d'ambiente
gcloud run services describe tt2112-digitale \
    --region europe-west1 \
    --format 'value(spec.template.spec.containers[0].env)'
```

### PDF non caricato
```bash
# Verifica che PDF sia in dist/
ls -lh dist/tt2112-template.pdf

# Rebuild se manca
npm run build

# Rebuild Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/tt2112-digitale
```

### Email non inviate
```bash
# Test SMTP credentials localmente
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'YOUR_EMAIL', pass: 'YOUR_APP_PASSWORD' }
});
transporter.verify().then(console.log).catch(console.error);
"
```

---

## 📚 Risorse Utili

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)

---

## ✅ Checklist Deploy

- [ ] Account Google Cloud creato
- [ ] Progetto GCP configurato
- [ ] gcloud CLI installato e autenticato
- [ ] Credenziali SMTP Gmail configurate
- [ ] Variabili d'ambiente in `.env.local`
- [ ] Build locale testato (`npm run build`)
- [ ] PDF presente in `dist/tt2112-template.pdf`
- [ ] Deploy eseguito con successo
- [ ] URL servizio funzionante
- [ ] Template PDF caricabile
- [ ] Form compilabile e PDF scaricabile
- [ ] Test da PC ufficio (se applicabile)
- [ ] Monitoring configurato

---

**Buon deploy! 🚀**

Per supporto: apri una issue su GitHub
