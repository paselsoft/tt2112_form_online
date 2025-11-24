# Usa un'immagine Node.js leggera e recente
FROM node:20-slim

# Imposta la directory di lavoro dentro il container
WORKDIR /app

# Copia i file di definizione delle dipendenze
COPY package*.json ./

# Installa tutte le dipendenze (sia per React che per Express)
RUN npm install

# Copia tutto il codice sorgente nel container
COPY . .

# Esegue la build dell'applicazione React (crea la cartella 'dist')
RUN npm run build

# Imposta la variabile d'ambiente PORT (necessaria per Cloud Run)
ENV PORT=8080

# Espone la porta 8080
EXPOSE 8080

# Avvia il server Node.js
CMD ["node", "api-server.js"]