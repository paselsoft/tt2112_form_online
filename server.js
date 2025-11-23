import { createRequire } from 'module';
import { fileURLToPath } from 'url';

// Usiamo createRequire per importare le librerie backend.
// Questo "nasconde" le dipendenze allo scanner automatico del deployment,
// impedendo che vengano iniettate erroneamente nel file index.html del frontend.
const require = createRequire(import.meta.url);
const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 8080;

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Email sending endpoint
app.post('/api/send-email', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file PDF allegato.' });
    }

    const { nome, cognome, emailUtente, telefono } = req.body;

    // Configure SMTP Transporter using Environment Variables
    // You must set these in Google Cloud Run settings
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // Your sender email
        pass: process.env.EMAIL_PASS, // Your App Password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"TT2112 Digitale" <noreply@tt2112.it>',
      to: 'paolo.selvaggini@mit.gov.it',
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
    console.log(`Email sent successfully for ${cognome} ${nome}`);
    res.status(200).json({ message: 'Email inviata con successo!' });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Errore durante l\'invio dell\'email. Riprova più tardi.' });
  }
});

// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});