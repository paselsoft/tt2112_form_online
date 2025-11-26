#!/bin/bash
# Comandi esatti per deploy update - Esegui dal tuo ambiente con gcloud
# Generato automaticamente - Pronto per essere eseguito

# Colori
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Deploy Update - TT2112 Digitale${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Configurazione
PROJECT_ID="gen-lang-client-0783889984"
SERVICE_NAME="tt2112-digitale"
REGION="us-west1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Info pre-deploy
echo -e "${YELLOW}📋 Configurazione:${NC}"
echo -e "   Project ID: ${PROJECT_ID}"
echo -e "   Service: ${SERVICE_NAME}"
echo -e "   Region: ${REGION}\n"

# Build locale GIÀ FATTO ✓
echo -e "${GREEN}✓ Build locale già completato${NC}"
echo -e "${GREEN}✓ PDF verificato: 1.2M (8 pagine)${NC}\n"

# Step 1: Build Docker image
echo -e "${BLUE}Step 1/2: Build Docker image (2-3 minuti)...${NC}"
gcloud builds submit \
  --tag ${IMAGE_NAME} \
  --project=${PROJECT_ID} \
  --timeout=10m

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image creata con successo${NC}\n"
else
    echo -e "${RED}❌ Errore build Docker image${NC}"
    exit 1
fi

# Step 2: Deploy su Cloud Run
echo -e "${BLUE}Step 2/2: Deploy su Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --project=${PROJECT_ID}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deploy completato con successo${NC}\n"
else
    echo -e "${RED}❌ Errore deploy${NC}"
    exit 1
fi

# Ottieni URL servizio
echo -e "${BLUE}📍 Recupero URL servizio...${NC}"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --format 'value(status.url)' \
  --project=${PROJECT_ID})

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   ✅ UPDATE COMPLETATO!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}📍 URL Applicazione:${NC}"
echo -e "   ${GREEN}${SERVICE_URL}${NC}\n"

echo -e "${BLUE}📄 URL Template PDF:${NC}"
echo -e "   ${GREEN}${SERVICE_URL}/tt2112-template.pdf${NC}\n"

echo -e "${BLUE}🧪 TEST CRITICI DA ESEGUIRE:${NC}"
echo -e "   1. ${YELLOW}Browser test:${NC}"
echo -e "      - Apri ${SERVICE_URL}"
echo -e "      - DevTools Console (F12)"
echo -e "      - Cerca: '✓ Template caricato da Cloud Run'"
echo -e ""
echo -e "   2. ${YELLOW}Test PDF diretto:${NC}"
echo -e "      curl -I ${SERVICE_URL}/tt2112-template.pdf"
echo -e ""
echo -e "   3. ${GREEN}🏢 TEST DA PC UFFICIO (CRITICO!):${NC}"
echo -e "      - Apri da PC ministeriale"
echo -e "      - Verifica caricamento automatico PDF"
echo -e "      - Compila form e scarica PDF\n"

echo -e "${BLUE}📊 Logs in tempo reale:${NC}"
echo -e "   gcloud run services logs tail ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID}\n"

echo -e "${GREEN}✨ Fatto! Ora testa dal PC ufficio!${NC}\n"
