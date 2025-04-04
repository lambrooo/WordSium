// --- js/improved-script.js ---
// Script migliorato per le pagine delle sezioni con scroll infinito

document.addEventListener('DOMContentLoaded', () => {
    // ===== CONFIGURAZIONE PRINCIPALE =====
    const body = document.body;
    const currentSection = body.dataset.section;
    const wordsContainer = document.getElementById('words-container');
    const wordTemplate = document.getElementById('word-card-template');
    const historyDrawer = document.getElementById('history-drawer');
    const historyToggleBtn = document.getElementById('view-history-btn');
    const quickShareModal = document.getElementById('quick-share-modal');
    
    // Stato dell'applicazione
    const state = {
        words: [], // Tutte le parole caricate dal JSON
        loadedWords: [], // Parole già mostrate all'utente
        loadedIDs: new Set(), // Set di ID per controllare rapidamente i duplicati
        isLoading: false, // Flag per il caricamento in corso
        visibleWordCards: [], // Array di elementi card visibili nel DOM
        viewHistory: [], // Cronologia di visualizzazione
        lastScrollPosition: 0 // Posizione di scroll per la gestione della cronologia con URL
    };

    // Numero di parole da precaricare all'avvio
    const INITIAL_WORD_COUNT = 3;
    
    // Numero massimo di card da mantenere nel DOM per performance
    const MAX_VISIBLE_CARDS = 10;
    
    // ===== INIZIALIZZAZIONE =====
    
    // Crea un overlay per quando il drawer della cronologia è aperto
    const drawerOverlay = document.createElement('div');
    drawerOverlay.className = 'drawer-overlay';
    document.body.appendChild(drawerOverlay);
    
    // Funzione principale di inizializzazione
    async function initialize() {
        try {
            // Carica tutte le parole disponibili
            await loadAllWords();
            
            // Controlla se c'è un parametro word nell'URL
            const urlParams = new URLSearchParams(window.location.search);
            const wordParam = urlParams.get('word');
            
            if (wordParam) {
                // Se c'è un ID di parola specifico nell'URL, carica quella parola
                const wordToShow = state.words.find(w => w.id === wordParam);
                if (wordToShow) {
                    renderSpecificWord(wordToShow);
                } else {
                    console.warn(`Word with ID "${wordParam}" not found`);
                    // Fallback: carica le parole iniziali
                    renderInitialWords();
                }
            } else {
                // Altrimenti carica le parole iniziali casualmente
                renderInitialWords();
            }
            
            // Mostra il toast se l'utente ha una streak
            checkAndUpdateStreak();
            
            // Imposta il titolo della pagina
            updatePageTitle();
            
            // Imposta l'anno nel footer
            setCurrentYear();
            
            // Nascondi l'indicatore di caricamento iniziale
            const loadingIndicator = document.querySelector('.word-loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Inizializza l'Intersection Observer per il caricamento lazy
            initIntersectionObserver();
            
            // Imposta l'event listener per lo scroll
            setupScrollListener();
            
            // Nasconde l'indicatore di scroll dopo un po'
            setTimeout(() => {
                const scrollIndicator = document.querySelector('.scroll-indicator');
                if (scrollIndicator) {
                    scrollIndicator.style.opacity = '0';
                    scrollIndicator.style.pointerEvents = 'none';
                }
            }, 5000);
            
        } catch (error) {
            console.error("Initialization error:", error);
            showToast("Error loading words. Please try refreshing the page.");
        }
    }

    // ===== FUNZIONI DI CARICAMENTO DATI =====
    
    // Carica tutte le parole dal JSON
    async function loadAllWords() {
        try {
            const response = await fetch('/data/words_mvp.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const allWords = await response.json();
            
            // Filtra per sezione corrente
            state.words = allWords.filter(word => word.section === currentSection);
            
            if (state.words.length === 0) {
                throw new Error(`No words found for section: ${currentSection}`);
            }
            
            // Avviso se ci sono poche parole
            if (state.words.length < 10) {
                console.warn(`Low word count (${state.words.length}) for section: ${currentSection}`);
            }
            
            return state.words;
        } catch (error) {
            console.error("Error loading words:", error);
            throw error;
        }
    }
    
    // Seleziona una parola casuale non ancora mostrata
    function getRandomWord() {
        if (state.words.length === 0) return null;
        
        // Se abbiamo mostrato tutte le parole, resetta (ma mantieni l'ordine attuale)
        if (state.loadedIDs.size >= state.words.length) {
            console.log("All words have been shown, resetting...");
            state.loadedIDs.clear();
        }
        
        // Filtra parole non ancora mostrate
        const availableWords = state.words.filter(word => !state.loadedIDs.has(word.id));
        
        if (availableWords.length === 0) {
            // Fallback se tutte sono state mostrate (non dovrebbe succedere)
            return state.words[Math.floor(Math.random() * state.words.length)];
        }
        
        // Seleziona una parola casuale tra quelle disponibili
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        return availableWords[randomIndex];
    }

    // ===== RENDERING DELLE PAROLE =====
    
    // Renderizza le parole iniziali
    function renderInitialWords() {
        for (let i = 0; i < INITIAL_WORD_COUNT; i++) {
            const word = getRandomWord();
            if (word) {
                renderWord(word);
            }
        }
    }
    
    // Renderizza una parola specifica (per deep linking)
    function renderSpecificWord(word) {
        // Svuota il container nel caso ci fosse già qualcosa
        while (wordsContainer.firstChild) {
            wordsContainer.removeChild(wordsContainer.firstChild);
        }
        
        // Renderizza la parola richiesta
        renderWord(word);
        
        // Renderizza anche qualche parola casuale dopo
        for (let i = 0; i < INITIAL_WORD_COUNT - 1; i++) {
            const nextWord = getRandomWord();
            if (nextWord && nextWord.id !== word.id) {
                renderWord(nextWord);
            }
        }
    }
    
    // Aggiunge una nuova card parola al container
    function renderWord(word) {
        if (!word || !wordTemplate) return;
        
        // Controllo duplicati (non dovrebbe succedere, ma per sicurezza)
        if (state.loadedIDs.has(word.id)) {
            console.warn(`Word ${word.id} already loaded, skipping`);
            return;
        }
        
        // Clona il template
        const wordCard = document.importNode(wordTemplate.content, true).querySelector('.word-card');
        
        // Popola i dati
        wordCard.dataset.wordId = word.id;
        wordCard.querySelector('.word-display').textContent = word.word;
        wordCard.querySelector('.definition-display').textContent = word.definition;
        
        // Formatta la storia
        const storyDisplay = wordCard.querySelector('.story-display');
        let formattedStory = word.story.replace(/\n/g, '<br>');
        formattedStory = formattedStory.replace(/\(Hook\)\s*/g, '<strong class="story-hook">');
        formattedStory = formattedStory.replace(/\(Storia\)\s*/g, '</strong><br><span class="story-main">');
        formattedStory = formattedStory.replace(/\(Esempio\)\s*/g, '</span><br><em class="story-example">');
        formattedStory = formattedStory.replace(/\(Takeaway\)\s*/g, '</em><br><p class="story-takeaway">');
        
        // Chiudi eventuali tag aperti
        if (formattedStory.includes('<strong class="story-hook">') && !formattedStory.includes('</strong>')) 
            formattedStory += '</strong>';
        if (formattedStory.includes('<span class="story-main">') && !formattedStory.includes('</span>')) 
            formattedStory += '</span>';
        if (formattedStory.includes('<em class="story-example">') && !formattedStory.includes('</em>')) 
            formattedStory += '</em>';
        if (formattedStory.includes('<p class="story-takeaway">') && !formattedStory.includes('</p>')) 
            formattedStory += '</p>';
        
        // Aggiungi wrapper per migliore stile
        storyDisplay.innerHTML = `<div class="story-content-wrapper">${formattedStory}</div>`;
        
        // Imposta numero progressivo
        const wordNumber = state.loadedWords.length + 1;
        wordCard.querySelector('.word-number').textContent = `#${wordNumber}`;
        
        // Controlla se la parola è già salvata
        const saveButton = wordCard.querySelector('.save-word-btn');
        const collection = JSON.parse(localStorage.getItem('wordCollection') || '[]');
        const isSaved = collection.some(item => (item.id && item.id === word.id) || item.word === word.word);
        
        if (isSaved) {
            saveButton.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
            saveButton.disabled = true;
        } else {
            saveButton.innerHTML = '<i class="far fa-bookmark"></i> Save this word';
            saveButton.disabled = false;
        }
        
        // Aggiungi event listeners
        setupWordCardListeners(wordCard, word);
        
        // Aggiungi al DOM
        wordsContainer.appendChild(wordCard);
        
        // Aggiungi alla lista di parole caricate
        state.loadedWords.push(word);
        state.loadedIDs.add(word.id);
        state.visibleWordCards.push(wordCard);
        
        // Aggiungi alla cronologia di visualizzazione
        addToViewHistory(word);
        
        // Mostra la card con animazione
        requestAnimationFrame(() => {
            setTimeout(() => {
                wordCard.classList.add('visible');
            }, 100);
        });
        
        // Pulisci vecchie card se ne abbiamo troppe
        cleanupExcessCards();
        
        return wordCard;
    }
    
    // Pulisce card vecchie per mantenere performance
    function cleanupExcessCards() {
        if (state.visibleWordCards.length > MAX_VISIBLE_CARDS) {
            // Rimuovi le card più vecchie (dall'inizio dell'array)
            const cardsToRemove = state.visibleWordCards.length - MAX_VISIBLE_CARDS;
            for (let i = 0; i < cardsToRemove; i++) {
                const oldCard = state.visibleWordCards.shift();
                if (oldCard && oldCard.parentNode) {
                    // Animazione di uscita
                    oldCard.classList.remove('visible');
                    oldCard.style.opacity = '0';
                    oldCard.style.transform = 'translateY(-30px)';
                    
                    // Rimuovi dopo l'animazione
                    setTimeout(() => {
                        if (oldCard.parentNode) {
                            oldCard.parentNode.removeChild(oldCard);
                        }
                    }, 300);
                }
            }
            
            console.log(`Removed ${cardsToRemove} old cards, ${state.visibleWordCards.length} remaining`);
        }
    }
    
    // Aggiunge alla cronologia e la aggiorna nell'interfaccia
    function addToViewHistory(word) {
        // Controlla se la parola è già nella cronologia
        const existingIndex = state.viewHistory.findIndex(item => item.id === word.id);
        
        if (existingIndex !== -1) {
            // Rimuovi l'elemento esistente
            state.viewHistory.splice(existingIndex, 1);
        }
        
        // Aggiungi all'inizio dell'array (più recente)
        state.viewHistory.unshift({
            id: word.id,
            word: word.word,
            section: word.section,
            timestamp: new Date().toISOString()
        });
        
        // Limita la cronologia a 30 elementi
        if (state.viewHistory.length > 30) {
            state.viewHistory.pop();
        }
        
        // Salva in localStorage
        localStorage.setItem(`${currentSection}_viewHistory`, JSON.stringify(state.viewHistory));
        
        // Aggiorna UI della cronologia
        updateHistoryUI();
    }
    
    // Carica la cronologia da localStorage
    function loadViewHistory() {
        const savedHistory = localStorage.getItem(`${currentSection}_viewHistory`);
        if (savedHistory) {
            try {
                state.viewHistory = JSON.parse(savedHistory);
            } catch (e) {
                console.error("Error parsing view history:", e);
                state.viewHistory = [];
            }
        }
        updateHistoryUI();
    }
    
    // Aggiorna UI della cronologia
    function updateHistoryUI() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        
        // Pulisci lista
        historyList.innerHTML = '';
        
        // Se vuota, mostra messaggio
        if (state.viewHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-history"></i>
                    <p>No words viewed yet</p>
                    <p>Words you discover will appear here</p>
                </div>
            `;
            return;
        }
        
        // Popola con elementi cronologia
        state.viewHistory.forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.dataset.wordId = item.id;
            
            // Formatta la data se disponibile
            let timeDisplay = '';
            if (item.timestamp) {
                const date = new Date(item.timestamp);
                timeDisplay = isToday(date) 
                    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
            
            // Capitalizza prima lettera della sezione
            const sectionName = item.section 
                ? item.section.charAt(0).toUpperCase() + item.section.slice(1)
                : '';
            
            li.innerHTML = `
                <div class="history-item-title">${item.word}</div>
                <div class="history-item-meta">
                    <span class="history-item-section">${sectionName}</span>
                    ${timeDisplay ? `<small class="history-item-time">${timeDisplay}</small>` : ''}
                </div>
            `;
            
            // Click per navigare alla parola
            li.addEventListener('click', () => {
                navigateToWord(item.id);
                closeHistoryDrawer();
            });
            
            historyList.appendChild(li);
        });
    }
    
    // Controlla se una data è oggi
    function isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }
    
    // ===== EVENT LISTENERS E INTERAZIONI =====
    
    // Configura listeners per una card parola
    function setupWordCardListeners(wordCard, wordData) {
        // Save button
        const saveButton = wordCard.querySelector('.save-word-btn');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                saveToCollection(wordData);
                saveButton.innerHTML = '<i class="fas fa-bookmark"></i> Saved!';
                saveButton.disabled = true;
            });
        }
        
        // Audio button
        const audioButton = wordCard.querySelector('.audio-btn');
        if (audioButton) {
            audioButton.addEventListener('click', () => {
                speakWord(wordData.word);
            });
        }
        
        // Share button
        const shareButton = wordCard.querySelector('.share-btn');
        if (shareButton) {
            shareButton.addEventListener('click', () => {
                openShareModal(wordData);
            });
        }
    }
    
    // Imposta l'Intersection Observer per il caricamento lazy
    function initIntersectionObserver() {
        // Opzioni per l'observer
        const options = {
            root: null, // viewport
            rootMargin: '0px 0px 300px 0px', // margine per pre-caricamento
            threshold: 0.1 // 10% della card visibile
        };
        
        // Callback di intersezione
        const handleIntersect = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Se è visibile, non fare nulla
                } else {
                    // Se non è visibile, controlla se è l'ultima card
                    const allCards = Array.from(document.querySelectorAll('.word-card'));
                    const lastCard = allCards[allCards.length - 1];
                    
                    if (entry.target === lastCard && !state.isLoading) {
                        // Se è l'ultima card e stiamo scrollando verso il basso, carica una nuova parola
                        const currentScrollPos = window.scrollY;
                        const isScrollingDown = currentScrollPos > state.lastScrollPosition;
                        state.lastScrollPosition = currentScrollPos;
                        
                        if (isScrollingDown) {
                            loadMoreWords();
                        }
                    }
                }
            });
        };
        
        // Crea e attiva l'observer
        const observer = new IntersectionObserver(handleIntersect, options);
        
        // Osserva tutte le card
        document.querySelectorAll('.word-card').forEach(card => {
            observer.observe(card);
        });
        
        // Salva l'observer per aggiungere future card
        state.intersectionObserver = observer;
    }
    
    // Carica nuove parole durante lo scroll
    function loadMoreWords(count = 1) {
        if (state.isLoading) return;
        
        state.isLoading = true;
        console.log("Loading more words...");
        
        // Aggiungi indicatore di caricamento
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'word-loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading more words...</p>
        `;
        wordsContainer.appendChild(loadingIndicator);
        
        // Simula un breve ritardo per migliorare l'UX
        setTimeout(() => {
            // Rimuovi indicatore
            loadingIndicator.remove();
            
            // Carica nuove parole
            for (let i = 0; i < count; i++) {
                const word = getRandomWord();
                if (word) {
                    const newCard = renderWord(word);
                    
                    // Osserva la nuova card con l'Intersection Observer
                    if (newCard && state.intersectionObserver) {
                        state.intersectionObserver.observe(newCard);
                    }
                }
            }
            
            state.isLoading = false;
        }, 600);
    }
    
    // Setup per l'event listener di scroll
    function setupScrollListener() {
        // Debounce function per migliorare performance
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
        
        // Handler dello scroll
        const handleScroll = debounce(() => {
            // Controlla se siamo vicini al fondo della pagina
            const scrollPos = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            // Se siamo a meno di 600px dal fondo, carica più contenutoa
            if (documentHeight - (scrollPos + windowHeight) < 600) {
                loadMoreWords();
            }
            
            // Aggiorna posizione di scroll per il tracker di direzione
            state.lastScrollPosition = scrollPos;
        }, 200); // Aggiorna al massimo ogni 200ms
        
        // Aggiungi listener
        window.addEventListener('scroll', handleScroll);
    }
    
    // ===== FUNZIONI DI UTILITÀ =====
    
    // Salva una parola nella collezione
    function saveToCollection(word) {
        try {
            let collection = JSON.parse(localStorage.getItem('wordCollection') || '[]');
            const wordExists = collection.some(item => 
                (item.id && item.id === word.id) || item.word === word.word
            );
            
            if (!wordExists) {
                collection.push({
                    id: word.id,
                    word: word.word,
                    definition: word.definition,
                    section: currentSection,
                    story: word.story
                });
                
                localStorage.setItem('wordCollection', JSON.stringify(collection));
                showToast('Word saved to your collection!');
            } else {
                showToast('This word is already in your collection!');
            }
        } catch (e) {
            console.error("Error saving to collection:", e);
            showToast("Error saving word.");
        }
    }
    
    // Funzione per pronunciare una parola
    function speakWord(word) {
        if ('speechSynthesis' in window) {
            // Cancella qualsiasi pronuncia precedente
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.9; // Leggermente più lento per chiarezza
            
            // Feedback visivo
            showToast('Playing pronunciation...');
            
            window.speechSynthesis.speak(utterance);
        } else {
            showToast('Text-to-speech not supported in your browser');
        }
    }
    
    // Apre il modal di condivisione
    function openShareModal(wordData) {
        if (!quickShareModal) return;
        
        // Imposta i dati della parola nel modal
        const wordNameEl = quickShareModal.querySelector('.share-word-name');
        if (wordNameEl) {
            wordNameEl.textContent = wordData.word;
        }
        
        // Imposta URL per condivisione
        const shareUrl = `${window.location.origin}${window.location.pathname}?word=${wordData.id}`;
        
        // Setup listeners per i pulsanti di condivisione
        setupShareButtons(shareUrl, wordData);
        
        // Mostra il modal
        quickShareModal.classList.add('active');
    }
    
    // Imposta i listener per i pulsanti di condivisione
    function setupShareButtons(shareUrl, wordData) {
        const shareOptions = quickShareModal.querySelectorAll('.share-option');
        shareOptions.forEach(option => {
            // Rimuovi i vecchi listener
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);
            
            const platform = newOption.dataset.platform;
            const text = `Check out this word: "${wordData.word}" - ${wordData.definition}`;
            
            if (platform) {
                newOption.addEventListener('click', () => {
                    shareOnPlatform(platform, shareUrl, text, wordData.word);
                });
            } else if (newOption.classList.contains('copy-link')) {
                newOption.addEventListener('click', () => {
                    copyToClipboard(shareUrl);
                });
            }
        });
    }
    
    // Condivide su piattaforme social
    function shareOnPlatform(platform, url, text, title) {
        const encodedUrl = encodeURIComponent(url);
        const encodedText = encodeURIComponent(text);
        const encodedTitle = encodeURIComponent(title);
        
        let shareUrl = '';
        
        switch(platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}&hashtags=WordSurprise,Vocabulary`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`;
                break;
            default:
                console.warn("Unsupported share platform:", platform);
                closeShareModal();
                return;
        }
        
        // Apri in una nuova finestra e chiudi il modal
        window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
        closeShareModal();
    }
    
    // Chiude il modal di condivisione
    function closeShareModal() {
        if (quickShareModal) {
            quickShareModal.classList.remove('active');
        }
    }
    
    // Copia negli appunti
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    showToast('Link copied to clipboard!');
                    closeShareModal();
                })
                .catch(err => {
                    console.error('Clipboard API Error: ', err);
                    fallbackCopyToClipboard(text);
                });
        } else {
            console.warn("Clipboard API not available, using fallback");
            fallbackCopyToClipboard(text);
        }
    }
    
    // Fallback per copia negli appunti
    function fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showToast('Link copied to clipboard!');
                closeShareModal();
            } else {
                showToast('Copy failed. Please copy manually.');
            }
        } catch (err) {
            showToast('Copy failed. Please copy manually.');
            console.error('Fallback copy error: ', err);
        }
        
        document.body.removeChild(textArea);
    }
    
    // Naviga a una parola specifica
    function navigateToWord(wordId) {
        // Verifica se la parola è già caricata
        const existingCard = document.querySelector(`.word-card[data-word-id="${wordId}"]`);
        
        if (existingCard) {
            // Scorri alla card
            existingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Aggiungi highlight temporaneo
            existingCard.classList.add('highlighted');
            setTimeout(() => {
                existingCard.classList.remove('highlighted');
            }, 2000);
        } else {
            // Carica la parola specifica
            const word = state.words.find(w => w.id === wordId);
            if (word) {
                // Aggiorna URL
                window.history.pushState({}, '', `?word=${wordId}`);
                
                // Renderizza la parola
                renderSpecificWord(word);
                
                // Scroll smooth all'inizio
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                showToast("Word not found");
            }
        }
    }
    
    // Verifica e aggiorna la streak dell'utente
    function checkAndUpdateStreak() {
        const today = new Date().toLocaleDateString();
        const lastVisit = localStorage.getItem('lastVisit');
        let currentStreak = parseInt(localStorage.getItem('streak') || '0');
        
        if (lastVisit === today) {
            // Già visitato oggi
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toLocaleDateString();
            
            if (lastVisit === yesterdayStr) {
                // Visita consecutiva
                currentStreak++;
                showToast(`🔥 ${currentStreak}-day streak! Keep it up!`);
            } else if (lastVisit) {
                // Streak interrotta
                currentStreak = 1;
                showToast("Welcome back! Your streak starts again today.");
            } else {
                // Prima visita
                currentStreak = 1;
                showToast("Welcome to WordSurprise! First day of your streak!");
            }
            
            localStorage.setItem('streak', currentStreak.toString());
            localStorage.setItem('lastVisit', today);
        }
    }
    
    // Mostra un toast di notifica
    function showToast(message) {
        const toast = document.getElementById('toast-notification');
        if (toast) {
            toast.textContent = message;
            toast.classList.remove('active');
            void toast.offsetWidth; // Force reflow
            toast.classList.add('active');
            
            if (toast.hideTimeout) clearTimeout(toast.hideTimeout);
            toast.hideTimeout = setTimeout(() => {
                toast.classList.remove('active');
            }, 3000);
        }
    }
    
    // Aggiorna il titolo della pagina
    function updatePageTitle() {
        const sectionName = currentSection.charAt(0).toUpperCase() + currentSection.slice(1);
        document.title = `WordSurprise ${sectionName}`;
    }
    
    // Imposta l'anno corrente nel footer
    function setCurrentYear() {
        const yearEl = document.getElementById('year');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    }
    
    // ===== GESTIONE TEMA CHIARO/SCURO =====
    function applyTheme() {
        const savedTheme = localStorage.getItem('darkTheme');
        if (savedTheme === 'true') {
            document.body.classList.add('dark-theme');
        } else if (savedTheme === 'false') {
            document.body.classList.remove('dark-theme');
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
        }
    }
    
    // ===== GESTIONE HISTORY DRAWER =====
    
    // Apri drawer cronologia
    function openHistoryDrawer() {
        if (historyDrawer) {
            historyDrawer.classList.add('active');
            drawerOverlay.classList.add('active');
            // Precarica la cronologia se necessario
            if (state.viewHistory.length === 0) {
                loadViewHistory();
            }
        }
    }
    
    // Chiudi drawer cronologia
    function closeHistoryDrawer() {
        if (historyDrawer) {
            historyDrawer.classList.remove('active');
            drawerOverlay.classList.remove('active');
        }
    }
    
    // ===== EVENT LISTENERS PRINCIPALI =====
    
    // Toggle tema
    applyTheme();
    
    // Click su pulsante cronologia
    if (historyToggleBtn) {
        historyToggleBtn.addEventListener('click', openHistoryDrawer);
    }
    
    // Click su close drawer
    const closeDrawerBtn = document.querySelector('.close-drawer');
    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', closeHistoryDrawer);
    }
    
    // Click su overlay per chiudere drawer
    drawerOverlay.addEventListener('click', closeHistoryDrawer);
    
    // Close button per share modal
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeShareModal);
    }
    
    // Popstate per gestire back/forward del browser
    window.addEventListener('popstate', (event) => {
        const urlParams = new URLSearchParams(window.location.search);
        const wordParam = urlParams.get('word');
        
        if (wordParam) {
            // Se c'è un parametro word, carica quella parola
            const wordToShow = state.words.find(w => w.id === wordParam);
            if (wordToShow) {
                renderSpecificWord(wordToShow);
            }
        } else {
            // Altrimenti ricarica la pagina per semplicità
            window.location.reload();
        }
    });
    
    // Inizializza l'applicazione
    initialize();
});