// --- js/main.js ---
// Script per la Homepage (index.html)

// Funzione immediata per nascondere il loader della homepage
(function() {
    const forceHideLoader = () => {
        const loader = document.querySelector('.page-loader');
        if (loader) {
            if (!loader.classList.contains('loaded')) {
                 loader.classList.add('loaded');
                 setTimeout(() => {
                    if (loader) loader.style.display = 'none';
                 }, 800); // Durata transizione
            }
        }
    };
    // Nascondi dopo 2 secondi come fallback massimo
    setTimeout(forceHideLoader, 2000);

    // Assicurati che il body abbia la classe per gli stili specifici homepage
    document.body.classList.add('homepage-body');
})();


document.addEventListener('DOMContentLoaded', () => {

    // ===== GESTIONE LOADER (Primaria) =====
    const pageLoader = document.querySelector('.page-loader');
    const hideLoader = function() {
        if (pageLoader && !pageLoader.classList.contains('loaded')) {
            pageLoader.classList.add('loaded');
            setTimeout(() => {
                if (pageLoader) pageLoader.style.display = 'none';
            }, 800);
        }
    };
    // Nascondi il loader un po' dopo l'inizio delle animazioni
    setTimeout(hideLoader, 1800); // Ritardo per permettere animazioni iniziali

    // ===== ANNO DINAMICO NEL FOOTER =====
    // (Spostato qui perché lo script inline in HTML è meno ideale)
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // ===== ANIMAZIONI ENTRATA HOMEPAGE =====
    const logo = document.querySelector('.logo-animated');
    const subtitle = document.querySelector('.subtitle-animated');
    const sectionTitle = document.querySelector('.section-title-animated');
    const links = document.querySelectorAll('.section-link');
    const infoElements = document.querySelectorAll('.info-animated'); // Rinominato per chiarezza

    // Animazioni progressive con ritardo (coordinate con hideLoader)
    setTimeout(() => logo?.classList.add('active'), 1600);
    setTimeout(() => subtitle?.classList.add('active'), 1800);
    setTimeout(() => sectionTitle?.classList.add('active'), 2000);
    links.forEach((el, index) => {
        el.style.setProperty('--index', index); // Per delay CSS se usi var(--index)
        setTimeout(() => el.classList.add('active'), 2200 + (200 * index));
    });
    infoElements.forEach((el, index) => {
        setTimeout(() => el.classList.add('active'), 2500 + (index * 200));
    });

    // ===== SISTEMA GRADIENTI DINAMICI PER PULSANTI HOMEPAGE =====
    const bodyForGradient = document.body;
    function updateButtonGradients() {
        if (!links.length || !bodyForGradient.classList.contains('homepage-body')) return; // Esegui solo su homepage

        const computedStyle = getComputedStyle(bodyForGradient);
        const bgPosition = computedStyle.backgroundPosition;
        const positionMatch = bgPosition.match(/(\d+)%/);
        const positionPercent = positionMatch ? parseInt(positionMatch[1]) : 0;

        let currentGradient = 'peach'; // Default
        if (positionPercent >= 50 && positionPercent < 75) {
            currentGradient = 'mint';
        } else if (positionPercent >= 75) {
            currentGradient = 'mixed';
        }
        // Aggiorna solo se cambia o se non è impostato
        links.forEach(link => {
            if (link.dataset.gradient !== currentGradient) {
                link.setAttribute('data-gradient', currentGradient);
            }
        });
    }
    // Aggiorna i gradienti dei pulsanti in base allo sfondo animato
    if (links.length > 0) {
        updateButtonGradients(); // Imposta iniziale
        setInterval(updateButtonGradients, 250); // Aggiorna periodicamente
    }


    // ===== PREFETCH SEZIONI (dopo caricamento pagina) =====
    setTimeout(() => {
        const prefetchLinksHrefs = ['etymology/', 'travel/', 'writers/'];
        prefetchLinksHrefs.forEach(href => {
            const prefetchLink = document.createElement('link');
            prefetchLink.rel = 'prefetch';
            prefetchLink.href = href;
            document.head.appendChild(prefetchLink);
        });
    }, 3500); // Ritardato

    // ===== TOGGLE TEMA CHIARO/SCURO =====
    const themeToggle = document.getElementById('theme-toggle-btn');
    if (themeToggle) {
         // Applica tema all'avvio
        const savedTheme = localStorage.getItem('darkTheme');
        if (savedTheme === 'true') {
            document.body.classList.add('dark-theme');
            themeToggle.classList.add('dark-active');
        } else if (savedTheme === 'false') {
            document.body.classList.remove('dark-theme');
            themeToggle.classList.remove('dark-active');
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
            themeToggle.classList.add('dark-active');
        }

        // Listener per il click
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            themeToggle.classList.toggle('dark-active');
            localStorage.setItem('darkTheme', document.body.classList.contains('dark-theme'));
        });
    } else { // Se il bottone non c'è, applica comunque il tema salvato/preferito
         const savedTheme = localStorage.getItem('darkTheme');
         if (savedTheme === 'true') {
            document.body.classList.add('dark-theme');
         } else if (savedTheme === 'false') {
             document.body.classList.remove('dark-theme');
         } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
             document.body.classList.add('dark-theme');
         }
    }


    // ===== EFFETTO PARALLASSE SU DESKTOP (Opzionale) =====
    // Disabilitato di default, può interferire con animazione background
    /*
    if (window.innerWidth > 992) { // Solo su schermi grandi
        window.addEventListener('mousemove', (e) => {
            const moveX = (e.clientX / window.innerWidth - 0.5) * 15; // Amplificato leggermente
            const moveY = (e.clientY / window.innerHeight - 0.5) * 15;
            // Applica a un elemento contenitore invece che al body per non sovrascrivere l'animazione
            const pageContainer = document.querySelector('.page-container');
            if(pageContainer) {
                // Potresti applicare una trasformazione invece di background-position
                // pageContainer.style.transform = `translate(${moveX}px, ${moveY}px)`;
            }
        });
    }
    */

    // ===== NEWSLETTER =====
    const newsletterToggle = document.getElementById('newsletter-toggle');
    const newsletterFormDiv = document.getElementById('newsletter-form'); // Il div contenitore
    const signupForm = document.getElementById('signup-form');
    const thankYouMessage = document.querySelector('.thank-you-message');

    if (newsletterToggle && newsletterFormDiv) {
        newsletterToggle.addEventListener('click', () => {
            // Usa classi per gestire visibilità e animazione altezza definita in CSS
            newsletterFormDiv.classList.toggle('active');
        });
    }

    if (signupForm && thankYouMessage) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Impedisce invio standard
            const emailInput = signupForm.querySelector('input[type="email"]');
            const privacyCheck = document.getElementById('privacy-check');

            // Validazione semplice
            if (!emailInput.value || !emailInput.checkValidity()) {
                showToast("Please enter a valid email address.");
                emailInput.focus();
                return;
            }
            if (!privacyCheck.checked) {
                showToast("Please agree to the privacy policy.");
                return;
            }

            // Simula invio (qui andrebbe la chiamata fetch al backend)
            console.log("Simulating newsletter signup for:", emailInput.value);

            // Mostra messaggio di ringraziamento e nascondi form
            signupForm.style.display = 'none';
            thankYouMessage.style.display = 'block';

            // Resetta e nascondi dopo un po'
            setTimeout(() => {
                signupForm.reset(); // Pulisce i campi
                signupForm.style.display = 'block'; // Rende di nuovo visibile il form
                thankYouMessage.style.display = 'none'; // Nasconde il messaggio
                if (newsletterFormDiv) {
                    newsletterFormDiv.classList.remove('active'); // Chiude il pannello
                }
            }, 4000); // Tempo più lungo per leggere il messaggio
        });
    }

    // ===== INIZIALIZZA CONTATORE STREAK =====
    initStreak(); // Chiama la funzione definita più sotto

    // ===== MODALE COLLEZIONE (Apertura) =====
    const collectionBtn = document.getElementById('collection-btn'); // Assicurati che esista l'ID
    if (collectionBtn) {
        collectionBtn.addEventListener('click', () => {
            const modal = document.getElementById('collectionModal');
            if(modal) {
                 modal.classList.add('active');
                 renderCollection(); // Chiama funzione definita sotto
                 updateCollectionCounter(); // Aggiorna contatore sul pulsante
            }
        });
         updateCollectionCounter(); // Aggiorna contatore all'avvio
    }

    // ===== FILTRI COLLEZIONE =====
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active')); // Rimuovi da tutti
                btn.classList.add('active'); // Aggiungi al cliccato
                renderCollection(); // Rirenderizza con filtro attivo
            });
        });
    }

}); // --- FINE DOMContentLoaded ---


// ===== FUNZIONI GLOBALI (definite fuori da DOMContentLoaded per essere chiamate da onclick, ecc.) =====

// ===== CONDIVISIONE SOCIAL =====
function shareOnSocial(platform) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Discover beautiful and surprising words at WordSurprise!');
    const title = encodeURIComponent('WordSurprise - Daily Linguistic Wonder'); // Utile per alcune piattaforme
    let shareUrl = '';

    switch(platform) {
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}&hashtags=words,vocabulary`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
            break;
        case 'whatsapp':
             // Whatsapp Web/Desktop e Mobile
            shareUrl = `https://wa.me/?text=${text}%20${url}`;
            break;
        case 'linkedin': // Aggiunto LinkedIn
            shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${text}`;
            break;
        case 'pinterest': // Aggiunto Pinterest (serve un'immagine)
             // Potresti prendere l'URL di un'immagine rappresentativa del sito
             const imageUrl = encodeURIComponent(window.location.origin + '/img/logo-icon.png'); // Assicurati esista
            shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&media=${imageUrl}&description=${text}`;
             break;
        case 'email':
            shareUrl = `mailto:?subject=${title}&body=${text}%0A%0A${url}`; // %0A è a capo
            break;
        default:
            console.warn("Unsupported share platform:", platform);
            return; // Esce se la piattaforma non è supportata
    }

    // Apri in nuova finestra popup
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
}

// ===== GESTIONE MODALI =====
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        // Blocca scroll del body quando modale è aperta (opzionale)
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        // Riabilita scroll del body
        document.body.style.overflow = '';
    }
}

// Funzioni specifiche per mostrare modali (possono popolare dati se necessario)
function showInstagramShare() {
    // Potresti popolare dinamicamente qui se necessario, ma per ora solo mostra
    const modal = document.getElementById('instagramShareModal');
    if (!modal) return;

    // Esempio: Se fossimo su una pagina parola, potremmo prenderla
    // const wordEl = document.getElementById('word-display');
    // const defEl = document.getElementById('definition-display');
    // if(wordEl && defEl) {
    //      modal.querySelector('.insta-word').textContent = wordEl.textContent;
    //      modal.querySelector('.insta-definition').textContent = defEl.textContent;
    // } // Altrimenti usa i default nell'HTML

    showModal('instagramShareModal');
}

function showTikTokShare() {
    // Potresti aggiornare il testo da copiare qui
    // const wordEl = document.getElementById('word-display');
    // const defEl = document.getElementById('definition-display');
    // const copyBtn = document.querySelector('#tiktokShareModal .tiktok-copy-btn');
    // if(wordEl && defEl && copyBtn) {
    //      const textToCopy = `${wordEl.textContent} - ${defEl.textContent}. #WordSurprise #LearnNewWords`;
    //      copyBtn.setAttribute('onclick', `copyToClipboard('${textToCopy.replace(/'/g, "\\'")}')`); // Gestisce apici
    // }
    showModal('tiktokShareModal');
}

// ===== FUNZIONALITÀ TIKTOK =====
function openTikTok() {
    // Prova ad aprire l'app TikTok (funziona meglio su mobile)
    // Fallback apre il sito web
    const tiktokAppUrl = 'tiktok://'; // Schema URL per app (potrebbe non funzionare sempre)
    const tiktokWebUrl = 'https://www.tiktok.com/';

    // Tenta di aprire l'app, se fallisce (o dopo un timeout) apre il web
    const timeout = setTimeout(() => {
         window.open(tiktokWebUrl, '_blank');
    }, 500); // Mezzo secondo per tentare l'app

    window.location.href = tiktokAppUrl; // Tenta di lanciare l'app

    // Se l'app si apre, l'utente lascia il browser e il timeout non scatta (teoricamente)
    // Questo è un hack, non garantito al 100%
    window.addEventListener('pagehide', () => clearTimeout(timeout)); // Cancella se naviga via
    window.addEventListener('blur', () => clearTimeout(timeout)); // Cancella se perde focus (potrebbe aprirsi app)

}

// ===== COPIA NEGLI APPUNTI =====
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!');
        }).catch(err => {
            console.error('Clipboard API Error: ', err);
            fallbackCopyToClipboard(text); // Tenta fallback
        });
    } else {
        console.warn("Clipboard API not available, using fallback.");
        fallbackCopyToClipboard(text); // Usa fallback se API non supportata
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Rendi l'area di testo invisibile
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast('Copied to clipboard!');
        } else {
            showToast('Copy failed. Please copy manually.');
            console.error('Fallback copy command failed');
        }
    } catch (err) {
        showToast('Copy failed. Please copy manually.');
        console.error('Fallback copy error: ', err);
    }

    document.body.removeChild(textArea);
}

// ===== DOWNLOAD IMMAGINE INSTAGRAM =====
function downloadInstagramImage() {
    const card = document.getElementById('instagram-card');
    if (!card) {
        showToast("Error: Instagram card element not found.");
        return;
    }

    // Controlla se html2canvas è caricato
    if (typeof html2canvas === 'function') {
        captureAndDownload(card);
    } else {
        // Se non caricato (es. per 'defer'), prova ad aspettare un attimo
        console.warn("html2canvas not ready, waiting...");
        setTimeout(() => {
            if (typeof html2canvas === 'function') {
                captureAndDownload(card);
            } else {
                 showToast('Error loading image library. Please take a screenshot.');
                 console.error("html2canvas failed to load.");
            }
        }, 500); // Aspetta mezzo secondo
    }
}

function captureAndDownload(element) {
    html2canvas(element, {
        useCORS: true, // Per immagini esterne se ne usi
        allowTaint: true, // Può aiutare con immagini cross-origin
        backgroundColor: null // Usa lo sfondo CSS dell'elemento
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const word = element.querySelector('.insta-word')?.textContent || 'wordsurprise';
        link.href = imgData;
        // Nome file più descrittivo
        link.download = `${word.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_share.png`;
        document.body.appendChild(link); // Necessario per Firefox
        link.click();
        document.body.removeChild(link); // Pulisce
    }).catch(err => {
        showToast('Image generation failed. Please take a screenshot.');
        console.error("html2canvas error:", err);
    });
}

// ===== FUNZIONI COLLEZIONE PAROLE (Gestite da main.js perché il modal è sulla homepage) =====

// Funzione per aggiornare il contatore sul pulsante collezione (se esiste)
function updateCollectionCounter() {
     const collectionBtn = document.getElementById('collection-btn');
     const countSpan = collectionBtn?.querySelector('.collection-count');
     if (countSpan) {
         const collection = JSON.parse(localStorage.getItem('wordCollection') || '[]');
         countSpan.textContent = collection.length;
         countSpan.style.display = collection.length > 0 ? 'flex' : 'none'; // Mostra solo se > 0
     }
}


function removeFromCollection(wordIdOrName) { // Meglio usare ID se disponibile
    let collection = JSON.parse(localStorage.getItem('wordCollection') || '[]');
    const initialLength = collection.length;
    // Filtra tenendo gli elementi che NON corrispondono
    collection = collection.filter(item => item.id !== wordIdOrName && item.word !== wordIdOrName);

    if (collection.length < initialLength) {
        localStorage.setItem('wordCollection', JSON.stringify(collection));
        renderCollection(); // Aggiorna la vista della modale
        updateCollectionCounter(); // Aggiorna contatore icona
        showToast('Word removed from your collection');
    }
}

function renderCollection() {
    const container = document.getElementById('saved-words');
    const emptyState = document.querySelector('.collection-empty');
    const modalContent = document.querySelector('#collectionModal .modal-content');

    if (!container || !emptyState || !modalContent) {
        console.error("Collection modal elements not found.");
        return;
    }

    const collection = JSON.parse(localStorage.getItem('wordCollection') || '[]');

    // Ottieni filtro attivo
    const activeFilterEl = document.querySelector('.filter-btn.active');
    const activeFilter = activeFilterEl ? activeFilterEl.dataset.filter : 'all';

    // Filtra collezione
    const filteredCollection = activeFilter === 'all'
        ? collection
        : collection.filter(item => item.section === activeFilter);

    // Gestisci stato vuoto
    if (filteredCollection.length === 0) {
        container.innerHTML = ''; // Pulisce eventuali card precedenti
        container.style.display = 'none';
        emptyState.style.display = 'block';
        const hint = emptyState.querySelector('.collection-hint');
        if (hint) {
            hint.textContent = activeFilter === 'all'
                ? 'Explore words in the sections and save them here!'
                : `No saved words in the '${activeFilter}' category yet.`;
        }
        return; // Esce se vuoto
    }

    // Mostra contenitore, nascondi stato vuoto
    container.style.display = 'grid'; // Assicura sia grid
    emptyState.style.display = 'none';
    container.innerHTML = ''; // Pulisce prima di ripopolare

    // Renderizza ogni parola filtrata
    filteredCollection.forEach(word => {
        const card = document.createElement('div');
        card.className = 'saved-word-card';
        // Usa l'ID se presente, altrimenti la parola per rimuovere/condividere
        const identifier = word.id || word.word;
        card.innerHTML = `
            <div> <!-- Contenitore per contenuto principale -->
                <div class="saved-word-title">${word.word}</div>
                <div class="saved-word-def">${word.definition || 'No definition available.'}</div>
            </div>
            <div> <!-- Contenitore per categoria e azioni -->
                 <div class="saved-word-category">${word.section || 'Unknown'}</div>
                 <div class="saved-word-actions">
                    <button class="word-action-btn share-word" data-identifier="${identifier}" title="Share this word">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="word-action-btn remove-word" data-identifier="${identifier}" title="Remove from collection">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        // Aggiungi listener alla card stessa per potenziale dettaglio futuro
        // card.addEventListener('click', () => showWordDetail(word));
        container.appendChild(card);
    });

    // Aggiungi event listener ai nuovi pulsanti creati
    container.querySelectorAll('.remove-word').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Impedisce trigger click sulla card
            const identifierToRemove = btn.dataset.identifier;
            removeFromCollection(identifierToRemove);
        });
    });

    container.querySelectorAll('.share-word').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const identifierToShare = btn.dataset.identifier;
            // Trova i dati completi della parola dalla collezione originale
            const wordData = collection.find(item => (item.id === identifierToShare || item.word === identifierToShare));
            if (wordData) {
                 prepareShareImage(wordData); // Prepara immagine per Instagram
                 hideModal('collectionModal'); // Chiude modale collezione
                 showInstagramShare(); // Mostra modale Instagram
            } else {
                showToast("Could not find word data to share.");
            }
        });
    });
}

// Prepara immagine Instagram con dati specifici da un oggetto parola
function prepareShareImage(wordData) {
    if (!wordData) return;

    const modal = document.getElementById('instagramShareModal');
    if (!modal) return;

    const instaWord = modal.querySelector('.insta-word');
    const instaDef = modal.querySelector('.insta-definition');
    const instaCategory = modal.querySelector('.insta-category');
    // const instaPhonetic = modal.querySelector('.insta-phonetic'); // Se vuoi aggiungere fonetica

    if (instaWord) instaWord.textContent = wordData.word;
    if (instaDef) instaDef.textContent = wordData.definition;
    // if (instaPhonetic) instaPhonetic.textContent = wordData.phonetic || ''; // Aggiungi se hai dati fonetici

    if (instaCategory) {
        const sectionName = wordData.section ? (wordData.section.charAt(0).toUpperCase() + wordData.section.slice(1)) : 'Word';
        instaCategory.textContent = `${sectionName} Collection`;
    }
}

// ===== NOTIFICHE TOAST =====
function showToast(message) {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
        // Assicurati che gli stili siano nel CSS principale!
    }

    toast.textContent = message;
    // Forza reflow per riavviare animazione se cliccato rapidamente
    toast.classList.remove('active');
    void toast.offsetWidth; // Trigger reflow
    toast.classList.add('active');

    // Nascondi dopo un po'
    // Cancella timeout precedente se esiste
    if (toast.hideTimeout) clearTimeout(toast.hideTimeout);
    toast.hideTimeout = setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// ===== SISTEMA TRACCIAMENTO STREAK =====
function initStreak() {
    const streakBadge = document.getElementById('streak-badge');
    const streakCount = document.getElementById('streak-count');

    if (!streakBadge || !streakCount) return;

    const today = new Date().toLocaleDateString(); // Formato YYYY/MM/DD o simile locale
    const lastVisit = localStorage.getItem('lastVisit');
    let currentStreak = parseInt(localStorage.getItem('streak') || '0');

    if (lastVisit === today) {
        // Già visitato oggi, non fare nulla alla streak
    } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString();

        if (lastVisit === yesterdayStr) {
            // Visita consecutiva
            currentStreak++;
        } else {
            // Streak interrotta o prima visita
            currentStreak = 1;
        }
        // Aggiorna localStorage solo se è una nuova visita
        localStorage.setItem('streak', currentStreak.toString());
        localStorage.setItem('lastVisit', today);
    }


    // Aggiorna display streak
    streakCount.textContent = currentStreak;
    const streakLabel = streakBadge.querySelector('.streak-label');
    if (streakLabel) {
        streakLabel.textContent = currentStreak === 1 ? 'day streak' : 'day streak';
    }


    // Aggiungi feedback visivo per streak
    streakBadge.classList.remove('milestone-streak', 'impressive-streak'); // Rimuove classi vecchie
    if (currentStreak >= 10) {
        streakBadge.classList.add('impressive-streak');
        showToast(`🔥 Impressive! ${currentStreak}-day streak! 🔥`);
    } else if (currentStreak >= 5) {
        streakBadge.classList.add('milestone-streak');
         if (lastVisit !== today) showToast(`Nice! ${currentStreak}-day streak! Keep it up!`);
    } else if (currentStreak > 1 && lastVisit !== today) {
         showToast(`Welcome back! ${currentStreak}-day streak!`);
    }
}