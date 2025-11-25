# Usa un'immagine Node.js leggera e recente
FROM node:20-slim

# Imposta la directory di lavoro dentro il container
WORKDIR /app

# Copia i file di definizione delle dipendenze
COPY package*.json ./

# Installa tutte le dipendenze (sia per React che per Express)
RUN npm install

# Copia tutto il codice# Copia il resto dei file
COPY . .

# Esegue la build dell'applicazione React (crea la cartella 'build_output')
RUN rm -rf build_output && npm run build

# Copia esplicitamente comuni.json nella cartella build_output e nella root
RUN cp public/comuni.json build_output/comuni.json && cp public/comuni.json ./comuni.json
RUN ls -lh build_output/comuni.json && ls -lh ./comuni.json

# Imposta la variabile d'ambiente PORT (necessaria per Cloud Run)
ENV PORT=8080

# Espone la porta 8080
EXPOSE 8080

# Avvia il server Node.js
CMD ["node", "api-server.js"]