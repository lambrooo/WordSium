const express = require('express');
const path = require('path'); // Modulo built-in di Node per gestire i percorsi

const app = express();
const port = 3000; // O la porta che preferisci

// --- Middleware per servire i file statici ---
// Questo dice a Express: "Se arriva una richiesta, cerca il file
// corrispondente nella cartella corrente (__dirname) e servilo."
// In questo modo, le richieste per /css/style.css, /js/script.js,
// /data/words_mvp.json, /etymology/index.html, ecc. funzioneranno.
app.use(express.static(__dirname));

// --- Route per la Homepage (necessaria perché express.static serve anche index.html) ---
// Potresti anche ometterla se la struttura dei file è corretta,
// express.static troverà index.html nella root.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Avvio del Server ---
app.listen(port, () => {
  console.log(`WordSurprise MVP in ascolto su http://localhost:${port}`);
});