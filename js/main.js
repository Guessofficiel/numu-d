/**
 * NUMU D - Main Scripts
 */

// Shared helpers for rendering data coming from SheetDB.
window.NUMUD = window.NUMUD || {};

window.NUMUD.escapeHTML = function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

window.NUMUD.nl2br = function nl2br(value) {
    return window.NUMUD.escapeHTML(value).replace(/\r?\n/g, '<br>');
};

window.NUMUD.safeImageUrl = function safeImageUrl(value, fallback) {
    const url = String(value || '').trim();
    if (!url) return fallback;
    if (/^(assets\/|\.\/|\/)/.test(url)) return window.NUMUD.escapeHTML(url);

    try {
        const parsed = new URL(url, window.location.href);
        if (['http:', 'https:'].includes(parsed.protocol)) {
            return window.NUMUD.escapeHTML(url);
        }
    } catch (error) {
        return fallback;
    }

    return fallback;
};

window.NUMUD.truncate = function truncate(value, maxLength) {
    const text = String(value ?? '');
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

window.NUMUD.fetchJSON = async function fetchJSON(url, options = {}) {
    const { ttl = 5 * 60 * 1000 } = options;
    const cacheKey = `numud:json:${url}`;

    try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            const entry = JSON.parse(cached);
            if (Date.now() - entry.time < ttl) return entry.data;
        }
    } catch (error) {
        sessionStorage.removeItem(cacheKey);
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Erreur reseau');
    const data = await response.json();

    try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ time: Date.now(), data }));
    } catch (error) {
        // Le cache est un bonus : le site doit continuer meme si le navigateur le refuse.
    }

    return data;
};

window.NUMUD.prefetchPage = function prefetchPage(url) {
    if (!url || window.NUMUD.prefetchedPages?.has(url)) return;
    window.NUMUD.prefetchedPages = window.NUMUD.prefetchedPages || new Set();
    window.NUMUD.prefetchedPages.add(url);

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'document';
    document.head.appendChild(link);
};

window.NUMUD.renderProductCard = function renderProductCard(item) {
    const escapeHTML = window.NUMUD.escapeHTML;
    const imageUrl = window.NUMUD.safeImageUrl(item.Image, 'https://via.placeholder.com/300x250?text=Image+Indisponible');
    const id = encodeURIComponent(item.Id || '');
    const name = escapeHTML(item.Nom || 'Produit NUMU D');
    const category = escapeHTML(item.Categorie || 'Général');
    const description = escapeHTML(window.NUMUD.truncate(item.Description || 'Aucune description disponible.', 80));
    const price = escapeHTML(item.Prix || '');
    const isAvailable = item.Disponible && item.Disponible.toLowerCase() === 'oui';
    const orderMessage = encodeURIComponent(`Bonjour, je souhaite commander ${item.Nom || 'ce produit'}`);
    const badge = isAvailable
        ? '<span style="display:inline-block;background:#28a745;color:#fff;font-size:0.75rem;font-weight:600;padding:3px 10px;border-radius:20px;margin-bottom:10px;"><i class="fas fa-check-circle"></i> Disponible</span>'
        : '<span style="display:inline-block;background:#dc3545;color:#fff;font-size:0.75rem;font-weight:600;padding:3px 10px;border-radius:20px;margin-bottom:10px;"><i class="fas fa-times-circle"></i> Rupture de stock</span>';

    return `
        <article class="product-card" style="${!isAvailable ? 'opacity:0.75;' : ''}">
            <div style="position:relative;">
                <img src="${imageUrl}" alt="${name}" class="product-img" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-category">${category}</div>
                <h3 class="product-title">${name}</h3>
                ${badge}
                <p class="product-desc">${description}</p>
                <div class="product-price">${price} CFA</div>
                <div class="product-actions">
                    <a href="collection-details.html?id=${id}" class="btn btn-outline" style="padding:8px 15px;flex:1;font-size:0.9rem;text-align:center;">Voir détails</a>
                    ${isAvailable
                        ? `<a href="https://wa.me/22379798513?text=${orderMessage}" target="_blank" rel="noopener" class="btn btn-whatsapp" style="padding:8px 15px;font-size:0.9rem;" title="Commander sur WhatsApp"><i class="fab fa-whatsapp"></i></a>`
                        : '<button class="btn" style="padding:8px 15px;font-size:0.9rem;background:#ccc;color:#999;cursor:not-allowed;" disabled title="Indisponible"><i class="fab fa-whatsapp"></i></button>'
                    }
                </div>
            </div>
        </article>`;
};
// Fonction réutilisable pour filtrer par univers
function filterProductsByUniverse(data, universe) {
    return data.filter(
        item => item.Univers === universe
    );
}

// Fonction réutilisable pour récupérer les collections à la une
function getFeaturedCollections(data) {
    return data.filter(
        item => item.A_la_une && item.A_la_une.trim().toLowerCase() === "oui"
    );
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Sticky Navbar
    const navbar = document.querySelector('.navbar');
    let scrollTicking = false;

    if (navbar) {
        window.addEventListener('scroll', () => {
            if (scrollTicking) return;
            scrollTicking = true;

            requestAnimationFrame(() => {
                navbar.classList.toggle('scrolled', window.scrollY > 50);
                scrollTicking = false;
            });
        }, { passive: true });
    }

    // 2. Mobile Menu (Hamburger)
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    // Create close button dynamically if it doesn't exist
    if (navMenu && !document.querySelector('.menu-close')) {
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.classList.add('menu-close');
        navMenu.prepend(closeBtn);
        
        closeBtn.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    }

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navMenu && hamburger && navMenu.classList.contains('active') && !navMenu.contains(e.target) && !hamburger.contains(e.target)) {
            navMenu.classList.remove('active');
        }
    });

    // 3. Navigation plus rapide : on prepare les pages internes au survol / toucher.
    document.addEventListener('pointerover', (event) => {
        const link = event.target.closest('a[href]');
        if (!link) return;

        const url = new URL(link.getAttribute('href'), window.location.href);
        if (url.origin !== window.location.origin || url.hash || url.protocol !== window.location.protocol) return;

        window.NUMUD.prefetchPage(url.href);
    }, { passive: true });

    // 4. Floating WhatsApp
    // Ensure we don't duplicate it
    if (!document.querySelector('.floating-whatsapp')) {
        const waBtn = document.createElement('a');
        waBtn.href = 'https://wa.me/22379798513?text=' + encodeURIComponent('Bonjour, je souhaite obtenir plus d\'informations sur NUMU D.'); // Replace with real number
        waBtn.target = '_blank';
        waBtn.classList.add('floating-whatsapp');
        waBtn.innerHTML = '<i class="fab fa-whatsapp"></i>'; // Requires FontAwesome
        waBtn.setAttribute('aria-label', 'Contactez-nous sur WhatsApp');
        document.body.appendChild(waBtn);
    }
});
