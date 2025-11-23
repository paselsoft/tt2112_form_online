import express from 'express';
import nodemailer from 'nodemailer';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurazione base per ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 8080;

// Log all'avvio per debug
console.log('Avvio server API in corso...');

// Serve static files (Frontend build)
app.use(express.static(path.join(__dirname, 'dist')));

// Endpoint Invio Email
app.post('/api/send-email', upload.single('pdf'), async (req, res) => {
  console.log('Ricevuta richiesta invio email...');
  
  try {
    if (!req.file) {
      console.warn('Nessun file PDF allegato alla richiesta.');
      return res.status(400).json({ error: 'Nessun file PDF allegato.' });
    }

    const { nome, cognome, emailUtente, telefono } = req.body;

    // Verifica configurazione
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Credenziali email mancanti nelle variabili d\'ambiente.');
      return res.status(500).json({ error: 'Configurazione server incompleta (EMAIL_USER/PASS mancanti).' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false, // true per 465, false per altri
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"TT2112 Digitale" <noreply@tt2112.it>',
      to: 'paolo.selvaggini@mit.gov.it', // Destinatario finale
      replyTo: emailUtente || undefined,
      subject: `Nuova Pratica TT2112: ${cognome} ${nome}`,
      text: `
        È stata compilata una nuova pratica tramite il portale TT2112 Digitale.
        
        Dati Richiedente:
        Nome: ${nome} ${cognome}
        Email: ${emailUtente || 'N/A'}
        Telefono: ${telefono || 'N/A'}
        
        Il modello compilato è in allegato.
      `,
      attachments: [
        {
          filename: `TT2112_${cognome}_${nome}.pdf`,
          content: req.file.buffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email inviata con successo per: ${cognome} ${nome}`);
    res.status(200).json({ message: 'Email inviata con successo!' });

  } catch (error) {
    console.error('Errore critico invio email:', error);
    res.status(500).json({ error: 'Errore server durante l\'invio. Controlla i log.' });
  }
});

// Fallback per React Router (deve essere l'ultimo)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server attivo e in ascolto sulla porta ${PORT}`);
});