#!/bin/bash
# Script di deploy automatizzato per Google Cloud Run
# TT2112 Digitale - Compilazione Assistita Modulo Patente

set -e  # Exit on error

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurazione (MODIFICA QUESTI VALORI)
PROJECT_ID="${GCP_PROJECT_ID:-gen-lang-client-0783889984}"
SERVICE_NAME="tt2112-digitale"
REGION="us-west1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   TT2112 Digitale - Deploy su Google Cloud Run${NC}"
echo -e "${BLUE}==================================================${NC}\n"

# Verifica che gcloud sia installato
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI non trovato!${NC}"
    echo -e "${YELLOW}Installa gcloud SDK: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi

echo -e "${GREEN}✓ gcloud CLI trovato${NC}\n"

# Verifica configurazione project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⚠ Project ID attuale: $CURRENT_PROJECT${NC}"
    echo -e "${YELLOW}⚠ Project ID richiesto: $PROJECT_ID${NC}"
    read -p "Vuoi configurare il project? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gcloud config set project $PROJECT_ID
    fi
fi

# Verifica variabili d'ambiente
echo -e "${BLUE}📧 Configurazione Email SMTP${NC}"
if [ -z "$EMAIL_USER" ]; then
    echo -e "${YELLOW}⚠ EMAIL_USER non configurata${NC}"
    read -p "Inserisci EMAIL_USER (es: your-email@gmail.com): " EMAIL_USER
fi

if [ -z "$EMAIL_PASS" ]; then
    echo -e "${YELLOW}⚠ EMAIL_PASS non configurata${NC}"
    read -sp "Inserisci EMAIL_PASS (App Password): " EMAIL_PASS
    echo
fi

if [ -z "$EMAIL_FROM" ]; then
    EMAIL_FROM="TT2112 Digitale <noreply@tt2112.it>"
fi

echo -e "${GREEN}✓ Configurazione email OK${NC}\n"

# Step 1: Build locale per verificare
echo -e "${BLUE}🔨 Step 1: Build locale (verifica)...${NC}"
npm run build
if [ ! -f "dist/tt2112-template.pdf" ]; then
    echo -e "${RED}❌ PDF template non trovato in dist/!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build locale OK (PDF presente: $(du -h dist/tt2112-template.pdf | cut -f1))${NC}\n"

# Step 2: Enable APIs necessarie
echo -e "${BLUE}🔧 Step 2: Verifica API abilitate...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    --project=$PROJECT_ID 2>/dev/null || true
echo -e "${GREEN}✓ API abilitate${NC}\n"

# Step 3: Build Docker image
echo -e "${BLUE}🐳 Step 3: Build Docker image...${NC}"
echo -e "${YELLOW}Questo può richiedere 2-3 minuti...${NC}"
gcloud builds submit \
    --tag $IMAGE_NAME \
    --project=$PROJECT_ID \
    --timeout=10m
echo -e "${GREEN}✓ Docker image creata: $IMAGE_NAME${NC}\n"

# Step 4: Deploy su Cloud Run
echo -e "${BLUE}🚀 Step 4: Deploy su Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0 \
    --set-env-vars "EMAIL_HOST=smtp.gmail.com,EMAIL_USER=$EMAIL_USER,EMAIL_PASS=$EMAIL_PASS,EMAIL_FROM=$EMAIL_FROM,NODE_ENV=production" \
    --project=$PROJECT_ID

# Step 5: Recupera URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --format 'value(status.url)' \
    --project=$PROJECT_ID)

echo -e "\n${GREEN}==================================================${NC}"
echo -e "${GREEN}   ✅ DEPLOY COMPLETATO CON SUCCESSO!${NC}"
echo -e "${GREEN}==================================================${NC}\n"

echo -e "${BLUE}📍 URL Applicazione:${NC}"
echo -e "   ${GREEN}$SERVICE_URL${NC}\n"

echo -e "${BLUE}📄 URL Template PDF:${NC}"
echo -e "   ${GREEN}$SERVICE_URL/tt2112-template.pdf${NC}\n"

echo -e "${BLUE}📊 Comandi utili:${NC}"
echo -e "   ${YELLOW}# Visualizza logs${NC}"
echo -e "   gcloud run services logs read $SERVICE_NAME --region=$REGION --project=$PROJECT_ID\n"

echo -e "   ${YELLOW}# Apri applicazione nel browser${NC}"
echo -e "   open $SERVICE_URL\n"

echo -e "   ${YELLOW}# Aggiorna variabili d'ambiente${NC}"
echo -e "   gcloud run services update $SERVICE_NAME --region=$REGION --update-env-vars KEY=VALUE --project=$PROJECT_ID\n"

echo -e "${BLUE}🧪 Test suggeriti:${NC}"
echo -e "   1. Apri $SERVICE_URL"
echo -e "   2. Verifica caricamento PDF template"
echo -e "   3. Compila form e testa download PDF"
echo -e "   4. Testa invio email (opzionale)\n"

echo -e "${GREEN}✨ Deploy completato!${NC}\n"
