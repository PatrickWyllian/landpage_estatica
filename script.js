document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;

    /* ---- Theme toggle ---- */
    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);

    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });

    /* ---- FAQ accordion ---- */
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isOpen = header.classList.toggle('active');
            header.setAttribute('aria-expanded', isOpen);
            content.style.maxHeight = isOpen ? content.scrollHeight + 'px' : null;
        });
    });

    /* ---- Header shadow on scroll ---- */
    const header = document.getElementById('site-header');
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---- Trending (TMDB) — carousel ---- */
    const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYmQzN2ZlYjg2ZDNhMWIxMjhiZmVmYmFiOGIwZmJiZiIsIm5iZiI6MTc3NTE0MDc5Ni45MjksInN1YiI6IjY5Y2U3ZmJjMTMyZTQ0YmY1MzU5ZmFjMSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.sdkaj1jLkTqNsB3HDigVsydx0m4iVyXsPenK-nbakSM';
    const API_BASE = 'https://api.themoviedb.org/3';
    const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
    const WHATSAPP_NUM = '5511968924924';

    const track = document.getElementById('trending-track');
    const tabs = document.querySelectorAll('.tab[data-tab]');
    const cache = { movie: null, tv: null };

    const skeletonHTML = Array(10).fill('<div class="skeleton" aria-hidden="true"></div>').join('');
    track.innerHTML = skeletonHTML;

    function decodeToken(token) {
        try { return JSON.parse(atob(token.split('.')[1])); }
        catch { return null; }
    }

    async function fetchTrending(type) {
        if (cache[type]) return cache[type];
        const url = `${API_BASE}/${type === 'movie' ? 'movie' : 'tv'}/top_rated?language=pt-BR&page=1`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        if (!res.ok) throw new Error(`TMDB ${res.status}`);
        const data = await res.json();
        cache[type] = data.results.slice(0, 10);
        return cache[type];
    }

    function cardHTML(item, type) {
        const title = type === 'movie' ? item.title : item.name;
        const year = (item.release_date || item.first_air_date || '').slice(0, 4);
        const rating = item.vote_average ? item.vote_average.toFixed(1) : '—';
        return `
            <button class="movie-card cta-chatbot" title="${title}" data-movie="${title}">
                <img src="${IMG_BASE}${item.poster_path}" alt="Pôster de ${title}" loading="lazy" />
                <span class="rating">${rating}</span>
                <div class="overlay">
                    <h4>${title}</h4>
                    <div class="meta">${year} <strong>• ${rating}</strong></div>
                    <div class="watch-cta">
                        Assistir agora
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                </div>
            </button>`;
    }

    function renderCards(items, type) {
        const cards = items.map(item => cardHTML(item, type)).join('');
        track.innerHTML = cards + cards; // duplicate for infinite loop
    }

    async function switchTab(type) {
        tabs.forEach(t => {
            t.classList.toggle('active', t.dataset.tab === type);
            t.setAttribute('aria-selected', t.dataset.tab === type);
        });
        track.innerHTML = skeletonHTML;
        try {
            const items = await fetchTrending(type);
            renderCards(items, type);
        } catch (err) {
            track.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:40px 0;width:100%;">Não foi possível carregar o conteúdo. Verifique sua conexão.</p>`;
            console.error('TMDB fetch error:', err);
        }
    }

    tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));

    const tokenData = decodeToken(TMDB_TOKEN);
    if (tokenData && tokenData.exp * 1000 > Date.now()) {
        switchTab('movie');
        // Pre-fetch séries em background para carregar instantâneo ao clicar na aba
        fetchTrending('tv').catch(() => {});
    } else {
        track.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:40px 0;width:100%;">Token TMDB expirado. Atualize o token.</p>`;
    }

    /* ============================================================
       CHATBOT MODULE
       ============================================================ */
    const WEBHOOK_URL = 'https://SEU-N8N-AQUI.com/webhook/chatbot-streamplay';

    const ChatBot = (() => {
        const $panel    = document.getElementById('chatbot-panel');
        const $overlay  = document.getElementById('chatbot-overlay');
        const $messages = document.getElementById('chatbot-messages');
        const $input    = document.getElementById('chatbot-input-area');
        const $fab      = document.getElementById('chatbot-open');
        const $closeBtn = document.getElementById('chatbot-close');

        let state = 0;
        let leadData = {};
        let isOpen = false;
        let isTyping = false;

        const FLOW = [
            {
                id: 'greeting',
                messages: () => {
                    if (leadData.filme) {
                        return [
                            `Vi que você curte "${leadData.filme}"! 🍿`,
                            'Quer testar a StreamPlay grátis pra assistir isso e muito mais?',
                            'É rapidinho, só preciso de algumas informações. Bora?'
                        ];
                    }
                    return [
                        'E aí! 👋 Quer testar a StreamPlay grátis?',
                        'É rapidinho, só preciso de algumas informações pra liberar seu acesso. Bora?'
                    ];
                },
                type: 'options',
                options: [{ label: 'Bora! 🚀', value: 'bora' }],
                next: () => 1
            },
            {
                id: 'device',
                messages: [
                    'Pra gente garantir que funciona bem pra você... 😊',
                    'Você tem Smart TV, Fire Stick, TV Box ou Chromecast?'
                ],
                type: 'options',
                options: [
                    { label: 'Smart TV', value: 'Smart TV' },
                    { label: 'Fire Stick', value: 'Fire Stick' },
                    { label: 'TV Box', value: 'TV Box' },
                    { label: 'Chromecast', value: 'Chromecast' },
                    { label: 'Nenhum desses', value: 'outro' }
                ],
                field: 'dispositivo',
                next: () => 2
            },
            {
                id: 'preference',
                messages: ['E o que você mais gosta de assistir?'],
                type: 'options',
                options: [
                    { label: 'Filmes', value: 'Filmes' },
                    { label: 'Séries', value: 'Séries' },
                    { label: 'Esportes', value: 'Esportes' },
                    { label: 'Tudo!', value: 'Tudo' }
                ],
                field: 'preferencia',
                next: () => 3
            },
            {
                id: 'name',
                messages: ['Beleza! Só preciso do seu nome pra gente personalizar:'],
                type: 'input',
                placeholder: 'Seu nome',
                field: 'nome',
                next: () => 4
            },
            {
                id: 'whatsapp',
                messages: ['Agora me passa seu WhatsApp que vou mandar o acesso:'],
                type: 'input',
                placeholder: '(11) 99999-9999',
                field: 'whatsapp',
                next: () => 5
            },
            {
                id: 'email',
                messages: ['Por último, seu email pra confirmar:'],
                type: 'input',
                placeholder: 'seu@email.com',
                field: 'email',
                next: () => 6
            },
            {
                id: 'loading',
                messages: [],
                type: 'loading'
            },
            {
                id: 'success',
                messages: [],
                type: 'success'
            }
        ];

        /* -- helpers -- */
        function save()   { sessionStorage.setItem('chatbot_state', JSON.stringify({ state, leadData })); }
        function clear()  { sessionStorage.removeItem('chatbot_state'); }

        function scrollToBottom() {
            $messages.scrollTop = $messages.scrollHeight;
        }

        function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

        /* -- renderers -- */
        function addBotMsg(text) {
            return new Promise(resolve => {
                const bubble = document.createElement('div');
                bubble.className = 'chatbot-msg bot';
                bubble.textContent = text;
                $messages.appendChild(bubble);
                scrollToBottom();
                resolve();
            });
        }

        async function botSay(texts) {
            for (const t of texts) {
                showTyping();
                await delay(800 + Math.random() * 600);
                hideTyping();
                await addBotMsg(t);
                await delay(200);
            }
        }

        function addUserMsg(text) {
            const bubble = document.createElement('div');
            bubble.className = 'chatbot-msg user';
            bubble.textContent = text;
            $messages.appendChild(bubble);
            scrollToBottom();
        }

        function showTyping() {
            if (isTyping) return;
            isTyping = true;
            const el = document.createElement('div');
            el.className = 'chatbot-typing';
            el.id = 'typing-indicator';
            el.innerHTML = '<span></span><span></span><span></span>';
            $messages.appendChild(el);
            scrollToBottom();
        }

        function hideTyping() {
            isTyping = false;
            const el = document.getElementById('typing-indicator');
            if (el) el.remove();
        }

        function showOptions(options) {
            $input.innerHTML = '';
            const wrap = document.createElement('div');
            wrap.className = 'chatbot-options';
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'chatbot-option';
                btn.textContent = opt.label;
                btn.addEventListener('click', () => {
                    addUserMsg(opt.label);
                    wrap.remove();
                    $input.innerHTML = '';
                    if (FLOW[state].field) {
                        leadData[FLOW[state].field] = opt.value;
                        save();
                    }
                    state = FLOW[state].next();
                    save();
                    runStep();
                });
                wrap.appendChild(btn);
            });
            $input.appendChild(wrap);
        }

        function showInput(placeholder) {
            $input.innerHTML = '';
            const row = document.createElement('div');
            row.className = 'chatbot-input-row';

            const inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'chatbot-input';
            inp.placeholder = placeholder;
            inp.autocomplete = 'off';

            const btn = document.createElement('button');
            btn.className = 'chatbot-send';
            btn.disabled = true;
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';

            function submit() {
                const val = inp.value.trim();
                if (!val) return;
                addUserMsg(val);
                $input.innerHTML = '';
                if (FLOW[state].field) {
                    leadData[FLOW[state].field] = val;
                    save();
                }
                state = FLOW[state].next();
                save();
                runStep();
            }

            inp.addEventListener('input', () => { btn.disabled = !inp.value.trim(); });
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
            btn.addEventListener('click', submit);

            row.appendChild(inp);
            row.appendChild(btn);
            $input.appendChild(row);
            inp.focus();
        }

        async function showLoading() {
            $input.innerHTML = '';
            const el = document.createElement('div');
            el.className = 'chatbot-loading';
            const phrases = [
                'Verificando disponibilidade...',
                'Preparando seu acesso...',
                'Quase lá...'
            ];
            el.innerHTML = `
                <div class="chatbot-spinner"></div>
                <div class="chatbot-loading-text">${phrases[0]}</div>
            `;
            $messages.appendChild(el);
            scrollToBottom();

            for (let i = 1; i < phrases.length; i++) {
                await delay(1200);
                el.querySelector('.chatbot-loading-text').textContent = phrases[i];
            }
            await delay(1000);
            el.remove();

            // send to webhook
            sendToWebhook();

            // show success
            state = 8;
            runStep();
        }

        function showSuccess() {
            const el = document.createElement('div');
            el.className = 'chatbot-success';
            el.innerHTML = `
                <div class="chatbot-success-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h4>Pronto!</h4>
                <p>Seu teste grátis chegará no seu WhatsApp em instantes. Fique de olho! 📲</p>
            `;
            $messages.appendChild(el);
            scrollToBottom();
            clear();
        }

        function sendToWebhook() {
            const payload = {
                ...leadData,
                origem: 'landing_page',
                timestamp: new Date().toISOString()
            };
            if (WEBHOOK_URL.includes('SEU-N8N')) {
                console.log('[Chatbot] Webhook placeholder — dados:', payload);
                return;
            }
            fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(err => console.error('[Chatbot] Webhook error:', err));
        }

        /* -- flow engine -- */
        async function runStep() {
            if (state >= FLOW.length) return;
            const step = FLOW[state];

            if (step.type === 'loading') { await showLoading(); return; }
            if (step.type === 'success') { showSuccess(); return; }

            const msgs = typeof step.messages === 'function' ? step.messages() : step.messages;
            if (msgs && msgs.length) await botSay(msgs);
            await delay(300);

            if (step.type === 'options') showOptions(step.options);
            else if (step.type === 'input') showInput(step.placeholder);
        }

        /* -- open / close -- */
        function open() {
            if (isOpen) return;
            isOpen = true;
            $panel.classList.add('open');
            $overlay.classList.add('active');
            $fab.classList.add('open');
            document.body.style.overflow = 'hidden';

            // resume or start fresh
            const saved = sessionStorage.getItem('chatbot_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                state = parsed.state;
                leadData = parsed.leadData;
                // replay conversation so far
                replayConversation();
            } else if (state === 0) {
                runStep();
            }
        }

        function close() {
            isOpen = false;
            $panel.classList.remove('open');
            $overlay.classList.remove('active');
            $fab.classList.remove('open');
            document.body.style.overflow = '';
        }

        async function replayConversation() {
            // replay all messages up to current state
            for (let i = 0; i < state; i++) {
                const step = FLOW[i];
                if (step.messages.length) {
                    for (const m of step.messages) await addBotMsg(m);
                }
                if (step.field && leadData[step.field]) {
                    addUserMsg(leadData[step.field]);
                }
            }
            // now run current step
            runStep();
        }

        /* -- init -- */
        function init() {
            $fab.addEventListener('click', () => isOpen ? close() : open());
            $closeBtn.addEventListener('click', close);
            $overlay.addEventListener('click', close);

            document.querySelectorAll('.cta-chatbot').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.preventDefault();
                    // if clicked from a movie card, pass the movie name
                    const movie = btn.dataset.movie;
                    if (movie) leadData.filme = movie;
                    open();
                });
            });
        }

        return { init, open, close };
    })();

    ChatBot.init();

    /* ---- Reveal on scroll (IntersectionObserver) ---- */
    const revealTargets = document.querySelectorAll(
        '.feature-card, .testimonial-card, .accordion-item, .pricing-card, .cta-card, .section-header'
    );
    revealTargets.forEach(el => el.classList.add('reveal'));

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        revealTargets.forEach(el => io.observe(el));
    } else {
        revealTargets.forEach(el => el.classList.add('visible'));
    }
});
