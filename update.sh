#!/bin/bash
# Script di update rapido per servizio Cloud Run esistente
# Aggiorna solo il codice, mantiene tutte le configurazioni esistenti

set -e

# Colori
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ID="gen-lang-client-0783889984"
SERVICE_NAME="tt2112-digitale"
REGION="us-west1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   TT2112 - Update Cloud Run Service${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Verifica gcloud
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI non trovato!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ gcloud CLI trovato${NC}\n"

# Set project
echo -e "${BLUE}📋 Configurazione project...${NC}"
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✓ Project: $PROJECT_ID${NC}\n"

# Build locale per verifica
echo -e "${BLUE}🔨 Build locale (verifica PDF incluso)...${NC}"
npm run build

if [ ! -f "dist/tt2112-template.pdf" ]; then
    echo -e "${RED}❌ PDF template non trovato in dist/!${NC}"
    exit 1
fi

PDF_SIZE=$(du -h dist/tt2112-template.pdf | cut -f1)
echo -e "${GREEN}✓ Build OK - PDF presente: $PDF_SIZE${NC}\n"

# Build Docker image
echo -e "${BLUE}🐳 Build Docker image...${NC}"
echo -e "${YELLOW}Questo può richiedere 2-3 minuti...${NC}"
gcloud builds submit \
    --tag $IMAGE_NAME \
    --project=$PROJECT_ID \
    --timeout=10m

echo -e "${GREEN}✓ Docker image creata${NC}\n"

# Deploy su Cloud Run (update servizio esistente)
echo -e "${BLUE}🚀 Deploy update su Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --project=$PROJECT_ID

# Recupera URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --format 'value(status.url)' \
    --project=$PROJECT_ID)

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   ✅ UPDATE COMPLETATO!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}📍 URL Applicazione:${NC}"
echo -e "   ${GREEN}$SERVICE_URL${NC}\n"

echo -e "${BLUE}📄 URL Template PDF:${NC}"
echo -e "   ${GREEN}$SERVICE_URL/tt2112-template.pdf${NC}\n"

echo -e "${BLUE}🧪 Test da eseguire:${NC}"
echo -e "   1. Apri $SERVICE_URL"
echo -e "   2. Apri DevTools Console (F12)"
echo -e "   3. Verifica log: '✓ Template caricato con successo da Cloud Run'"
echo -e "   4. Compila form e testa download PDF"
echo -e "   5. ${YELLOW}TEST DA PC UFFICIO (importante!)${NC}\n"

echo -e "${BLUE}📊 Logs in tempo reale:${NC}"
echo -e "   gcloud run services logs tail $SERVICE_NAME --region=$REGION --project=$PROJECT_ID\n"

echo -e "${GREEN}✨ Deploy completato!${NC}\n"
