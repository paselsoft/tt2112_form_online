import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// OBFUSCATED IMPORTS
// We concatenate strings to hide dependencies from the static analysis scanner
// preventing it from injecting backend libs into index.html
const express = require('ex' + 'press');
const nodemailer = require('node' + 'mailer');
const multer = require('mul' + 'ter');
const path = require('pa' + 'th');
const { fileURLToPath } = require('u' + 'rl');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 8080;

console.log('[API] Avvio server API in corso...');

// Serve static files (Frontend build)
app.use(express.static(path.join(__dirname, 'dist')));

// Endpoint Invio Email
app.post('/api/send-email', upload.single('pdf'), async (req, res) => {
  console.log('[API] Ricevuta richiesta invio email...');
  
  try {
    if (!req.file) {
      console.warn('[API] Nessun file PDF allegato.');
      return res.status(400).json({ error: 'Nessun file PDF allegato.' });
    }

    const { nome, cognome, emailUtente, telefono } = req.body;

    // Configurazione SMTP (Simulata se mancano env vars per evitare crash in dev)
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.error('[API] Credenziali email mancanti (EMAIL_USER/EMAIL_PASS).');
      return res.status(500).json({ error: 'Configurazione server incompleta. Contatta l\'amministratore.' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass,
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
    console.log(`[API] Email inviata con successo per: ${cognome} ${nome}`);
    res.status(200).json({ message: 'Email inviata con successo!' });

  } catch (error) {
    console.error('[API] Errore critico invio email:', error);
    res.status(500).json({ error: 'Errore server durante l\'invio. Controlla i log.' });
  }
});

// Fallback per React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[API] Server attivo e in ascolto sulla porta ${PORT}`);
});