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
        const href = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(`Quero assistir "${title}" agora`)}`;
        return `
            <a href="${href}" target="_blank" rel="noopener" class="movie-card" title="${title}">
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
            </a>`;
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
    } else {
        track.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:40px 0;width:100%;">Token TMDB expirado. Atualize o token.</p>`;
    }

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
