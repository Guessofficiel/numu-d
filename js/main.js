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

window.NUMUD.normalizeKey = function normalizeKey(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
};

window.NUMUD.getField = function getField(item, keys, fallback = '') {
    if (!item) return fallback;

    const keyList = Array.isArray(keys) ? keys : [keys];

    for (const key of keyList) {
        if (Object.prototype.hasOwnProperty.call(item, key) && String(item[key] ?? '').trim() !== '') {
            return item[key];
        }
    }

    const normalizedKeys = Object.keys(item).reduce((acc, key) => {
        acc[window.NUMUD.normalizeKey(key)] = key;
        return acc;
    }, {});

    for (const key of keyList) {
        const match = normalizedKeys[window.NUMUD.normalizeKey(key)];
        if (match && String(item[match] ?? '').trim() !== '') {
            return item[match];
        }
    }

    return fallback;
};

window.NUMUD.imageFields = [
    'Image',
    'Images',
    'Image URL',
    'Image_URL',
    'ImageUrl',
    'URL Image',
    'Lien image',
    'Photo',
    'Photos',
    'Visuel',
    'Visuels'
];

window.NUMUD.extractImageValue = function extractImageValue(value) {
    const text = String(value || '').trim();
    if (!text) return '';

    const imageFormula = text.match(/=\s*IMAGE\s*\(\s*["']([^"']+)/i);
    if (imageFormula) return imageFormula[1].replace(/&amp;/g, '&');

    const quotedUrl = text.match(/["'](https?:\/\/[^"']+)["']/i);
    if (quotedUrl) return quotedUrl[1].replace(/&amp;/g, '&');

    const url = text.match(/https?:\/\/[^\s,;)]+/i);
    if (url) return url[0].replace(/&amp;/g, '&');

    return text.split(/[\n,;]/).map(part => part.trim()).find(Boolean) || '';
};

window.NUMUD.toDisplayImageUrl = function toDisplayImageUrl(value) {
    const rawUrl = window.NUMUD.extractImageValue(value);
    if (!rawUrl) return '';

    try {
        const parsed = new URL(rawUrl, window.location.href);
        const host = parsed.hostname.toLowerCase();
        const isGoogleDrive = host === 'drive.google.com' || (host.endsWith('.google.com') && parsed.pathname.includes('/uc'));

        if (isGoogleDrive) {
            let fileId = parsed.searchParams.get('id');
            const pathMatch = parsed.pathname.match(/\/(?:file\/)?d\/([^/]+)/);
            if (!fileId && pathMatch) fileId = pathMatch[1];
            if (fileId) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1200`;
        }
    } catch (error) {
        return rawUrl;
    }

    return rawUrl;
};

window.NUMUD.safeImageUrl = function safeImageUrl(value, fallback) {
    const url = window.NUMUD.toDisplayImageUrl(value);
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

window.NUMUD.getImageUrl = function getImageUrl(item, fallback) {
    return window.NUMUD.safeImageUrl(window.NUMUD.getField(item, window.NUMUD.imageFields), fallback);
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

window.NUMUD.paymentMethods = [
    { id: 'whatsapp', label: 'Commander via WhatsApp', icon: '<i class="fab fa-whatsapp"></i>', className: 'whatsapp' },
    { id: 'email', label: 'Commander par E-mail', icon: '<i class="fas fa-envelope"></i>', className: 'email' }
];

window.NUMUD.renderPaymentSelector = function renderPaymentSelector(options = {}) {
    const productName = window.NUMUD.escapeHTML(options.productName || 'ce produit');
    const price = window.NUMUD.escapeHTML(options.price || '');
    const isAvailable = options.isAvailable !== false;
    const methods = window.NUMUD.paymentMethods.map(method => `
        <button class="payment-method-option" type="button" data-payment-method="${window.NUMUD.escapeHTML(method.id)}">
            <span class="payment-method-icon payment-method-icon-${window.NUMUD.escapeHTML(method.className)}">${method.icon}</span>
            <span>${window.NUMUD.escapeHTML(method.label)}</span>
        </button>`
    ).join('');

    if (!isAvailable) {
        return '<button class="btn payment-buy-btn" type="button" disabled><i class="fas fa-shopping-bag"></i> Commander</button>';
    }

    return `
        <details class="payment-picker" data-payment-picker data-product-name="${productName}" data-product-price="${price}">
            <summary class="btn payment-buy-btn"><i class="fas fa-shopping-bag"></i> Commander</summary>
            <div class="payment-panel">
                ${methods}
            </div>
        </details>`;
};

window.NUMUD.injectPaymentStyles = function injectPaymentStyles() {
    if (document.getElementById('numud-payment-styles')) return;

    const style = document.createElement('style');
    style.id = 'numud-payment-styles';
    style.textContent = `
        .payment-picker {
            width: 100%;
            margin-top: 10px;
        }

        .payment-picker summary {
            list-style: none;
        }

        .payment-picker summary::-webkit-details-marker {
            display: none;
        }

        .payment-buy-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 14px;
            font-size: 0.95rem;
            background: var(--primary);
            color: var(--white);
            cursor: pointer;
        }

        .payment-buy-btn:hover {
            background: var(--secondary);
            color: var(--white);
        }

        .payment-buy-btn:disabled {
            background: #ccc;
            color: #777;
            cursor: not-allowed;
        }

        .payment-panel {
            display: grid;
            gap: 10px;
            margin-top: 10px;
            padding: 12px;
            border: 1px solid rgba(0, 0, 0, 0.12);
            border-radius: 8px;
            background: #fff;
        }

        .payment-method-option {
            width: 100%;
            min-height: 48px;
            padding: 8px 12px;
            border: 1px solid #d8d8d8;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: var(--font-primary);
            font-weight: 600;
            color: var(--primary);
            background: #fff;
            cursor: pointer;
            text-align: left;
            transition: var(--transition);
        }

        .payment-method-option:hover {
            border-color: var(--secondary);
            background: rgba(185, 122, 86, 0.08);
        }

        .payment-method-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 32px;
            color: #fff;
            font-weight: 700;
            line-height: 1;
        }

        .payment-method-icon-whatsapp {
            background: #25D366;
            font-size: 1.25rem;
        }

        .payment-method-icon-email {
            background: #D44638;
            font-size: 1.1rem;
        }

        .payment-method-icon-orange-money {
            background: #ff7900;
            color: #111;
        }

        .payment-method-icon-moov-money {
            background: linear-gradient(135deg, #0066b3, #66b82f);
        }

        .payment-method-icon-wave {
            background: #1fb6ff;
            font-size: 1.6rem;
        }

        .payment-method-icon-mastercard {
            background: #111;
            font-size: 1.35rem;
        }
    `;
    document.head.appendChild(style);
};

window.NUMUD.openPaymentOrder = function openPaymentOrder(picker, methodId) {
    const productName = picker.getAttribute('data-product-name') || 'ce produit';
    const price = picker.getAttribute('data-product-price') || '';

    if (methodId === 'whatsapp') {
        const orderMsg = encodeURIComponent(`Bonjour NUMU D, je souhaite commander : ${productName}${price ? ' (' + price + ' CFA)' : ''}`);
        window.open(`https://wa.me/22379798513?text=${orderMsg}`, '_blank', 'noopener,noreferrer');
        return;
    }

    if (methodId === 'email') {
        const subject = encodeURIComponent(`Commande : ${productName}`);
        const body = encodeURIComponent(`Bonjour l'équipe NUMU D,\n\nJe souhaite commander le produit suivant :\n- Produit : ${productName}\n${price ? '- Prix : ' + price + ' CFA\n' : ''}\nMerci de me contacter pour la validation et la livraison.\n\nCordialement,`);
        window.location.href = `mailto:hello@numu-d.fr?subject=${subject}&body=${body}`;
        return;
    }

    const params = new URLSearchParams({
        method: methodId,
        product: productName,
        price
    });

    window.location.href = `payment.html?${params.toString()}`;
};

window.NUMUD.renderProductCard = function renderProductCard(item) {
    const escapeHTML = window.NUMUD.escapeHTML;
    const imageUrl = window.NUMUD.getImageUrl(item, 'https://via.placeholder.com/300x250?text=Image+Indisponible');
    const id = encodeURIComponent(window.NUMUD.getField(item, ['Id', 'ID', 'Identifiant'], ''));
    const rawName = window.NUMUD.getField(item, ['Nom', 'Nom produit', 'Produit', 'Titre'], 'Produit NUMU D');
    const name = escapeHTML(rawName);
    const categoryFromSheet = escapeHTML(window.NUMUD.getField(item, ['Categorie', 'Catégorie', 'Category'], 'General'));
    const rawDescription = window.NUMUD.getField(item, ['Description', 'Description produit', 'Details', 'Détails', 'Detail'], 'Aucune description disponible.');
    const description = escapeHTML(window.NUMUD.truncate(rawDescription, 80));
    const rawPrice = window.NUMUD.getField(item, ['Prix', 'Price', 'Tarif'], '');
    const price = escapeHTML(rawPrice);
    const availability = String(window.NUMUD.getField(item, ['Disponible', 'Disponibilite', 'Disponibilité', 'Stock', 'Statut'], '')).trim().toLowerCase();
    const isAvailable = ['oui', 'yes', 'true', '1', 'disponible', 'available'].includes(availability);
    const orderMessage = encodeURIComponent(`Bonjour, je souhaite commander ${rawName || 'ce produit'}`);
    const paymentSelector = window.NUMUD.renderPaymentSelector({ productName: rawName, price: rawPrice, isAvailable });
    const badge = isAvailable
        ? '<span style="display:inline-block;background:#28a745;color:#fff;font-size:0.75rem;font-weight:600;padding:3px 10px;border-radius:20px;margin-bottom:10px;"><i class="fas fa-check-circle"></i> Disponible</span>'
        : '<span style="display:inline-block;background:#dc3545;color:#fff;font-size:0.75rem;font-weight:600;padding:3px 10px;border-radius:20px;margin-bottom:10px;"><i class="fas fa-times-circle"></i> Rupture de stock</span>';

    return `
        <article class="product-card" style="${!isAvailable ? 'opacity:0.75;' : ''}">
            <div style="position:relative;">
                <img src="${imageUrl}" alt="${name}" class="product-img" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-category">${categoryFromSheet}</div>
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
                ${paymentSelector}
            </div>
        </article>`;
};
// Fonction réutilisable pour filtrer par univers
function filterProductsByUniverse(data, universe) {
    const expectedUniverse = window.NUMUD.normalizeKey(universe);
    return data.filter(
        item => window.NUMUD.normalizeKey(window.NUMUD.getField(item, ['Univers', 'Universe'])) === expectedUniverse
    );
}

// Fonction réutilisable pour récupérer les collections à la une
function getFeaturedCollections(data) {
    return data.filter(
        item => ['oui', 'yes', 'true', '1'].includes(String(window.NUMUD.getField(item, ['A_la_une', 'A la une', 'Featured'], '')).trim().toLowerCase())
    );
}

document.addEventListener('DOMContentLoaded', () => {
    window.NUMUD.injectPaymentStyles();

    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-payment-method]');
        if (!button) return;

        const picker = button.closest('[data-payment-picker]');
        if (picker) window.NUMUD.openPaymentOrder(picker, button.getAttribute('data-payment-method'));
    });

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
