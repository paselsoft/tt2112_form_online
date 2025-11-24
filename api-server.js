// Utilizziamo Dynamic Imports (Top-Level Await)
// Questo impedisce agli scanner statici di rilevare le dipendenze e 
// iniettarle erroneamente nel file index.html frontend.

console.log('[SYSTEM] Avvio inizializzazione moduli...');

// Importazioni dinamiche
const expressModule = await import('express');
const nodemailerModule = await import('nodemailer');
const multerModule = await import('multer');
const pathModule = await import('path');
const urlModule = await import('url');

const express = expressModule.default;
const nodemailer = nodemailerModule.default;
const multer = multerModule.default;
const path = pathModule.default;
const { fileURLToPath } = urlModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 8080;

console.log('[API] Moduli caricati. Configurazione server...');

// Serve static files (Frontend build)
// Assicurarsi che 'npm run build' sia stato eseguito prima
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

    // Configurazione SMTP
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    // Controllo rigoroso delle credenziali
    if (!emailUser || !emailPass) {
      console.error('[API ERROR] Credenziali email mancanti nelle Variabili d\'Ambiente.');
      console.error('[API ERROR] Assicurati di aver impostato EMAIL_USER e EMAIL_PASS nel pannello di Cloud Run.');
      return res.status(500).json({ error: 'Configurazione server incompleta (Credenziali mancanti).' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail', // Usa il preset Gmail per semplicità
      auth: {
        user: emailUser,
        pass: emailPass, // Deve essere una "App Password" se usi 2FA
      },
    });

    const mailOptions = {
      from: `"TT2112 Digitale" <${emailUser}>`,
      to: 'paolo.selvaggini@mit.gov.it', // Destinatario Ufficiale
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

    // Verifica connessione SMTP prima dell'invio
    try {
        await transporter.verify();
        console.log('[API] Connessione SMTP verificata.');
    } catch (verifyError) {
        console.error('[API ERROR] Errore connessione SMTP:', verifyError);
        throw new Error("Impossibile connettersi al server di posta. Controlla le credenziali.");
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[API] Email inviata con successo! ID: ${info.messageId}`);
    res.status(200).json({ message: 'Email inviata con successo!', id: info.messageId });

  } catch (error) {
    console.error('[API CRITICAL]', error);
    res.status(500).json({ error: 'Errore durante l\'invio: ' + error.message });
  }
});

// Fallback per React Router (gestisce il refresh delle pagine)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[API] Server attivo su porta ${PORT}`);
  console.log(`[API] Environment: ${process.env.NODE_ENV}`);
});