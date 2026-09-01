/**
 * NUMU D - Product detail logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('detail-container');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!container) return;

    if (!productId) {
        container.innerHTML = '<div class="error-message">Aucun produit specifie. <a href="collections.html">Retour aux collections</a></div>';
        return;
    }

    try {
        const products = await window.NUMUD.fetchJSON(CONFIG.collectionsApi);
        const product = products.find(item => {
            const id = String(window.NUMUD.getField(item, ['Id', 'ID', 'Identifiant'], '')).trim();
            return id === productId;
        });

        if (!product) {
            container.innerHTML = '<div class="error-message">Produit introuvable. <a href="collections.html">Retour aux collections</a></div>';
            return;
        }

        renderProduct(product);
    } catch (error) {
        console.error('Fetch error:', error);
        container.innerHTML = '<div class="error-message">Impossible de charger ce produit. Veuillez reessayer plus tard.</div>';
    }

    function renderProduct(product) {
        const rawName = window.NUMUD.getField(product, ['Nom', 'Nom produit', 'Produit', 'Titre'], 'Produit NUMU D');
        const rawCategory = window.NUMUD.getField(product, ['Categorie', 'Catégorie', 'Category'], 'Collection');
        const rawDescription = window.NUMUD.getField(product, ['Description', 'Description produit', 'Details', 'Détails', 'Detail'], '');
        const rawPrice = window.NUMUD.getField(product, ['Prix', 'Price', 'Tarif'], '');
        const galleryImages = window.NUMUD.getImages(product);
        const images = galleryImages.length ? galleryImages : [window.NUMUD.placeholderImage('Image indisponible')];
        const availability = String(window.NUMUD.getField(product, ['Disponible', 'Disponibilite', 'Disponibilité', 'Stock', 'Statut'], '')).trim().toLowerCase();
        const isAvailable = ['oui', 'yes', 'true', '1', 'disponible', 'available'].includes(availability);

        const safeName = window.NUMUD.escapeHTML(rawName);
        const safeCategory = window.NUMUD.escapeHTML(rawCategory);
        const safeDescription = rawDescription
            ? window.NUMUD.nl2br(rawDescription)
            : 'Aucune description disponible pour le moment.';
        const safePrice = window.NUMUD.escapeHTML(rawPrice);
        const orderMessage = encodeURIComponent(`Bonjour, je souhaite commander ${rawName || 'ce produit'}`);
        const paymentSelector = window.NUMUD.renderPaymentSelector({ productName: rawName, price: rawPrice, isAvailable });
        const badge = isAvailable
            ? '<span style="display:inline-block;background:#28a745;color:#fff;font-size:0.85rem;font-weight:600;padding:5px 12px;border-radius:20px;margin-bottom:20px;"><i class="fas fa-check-circle"></i> Disponible</span>'
            : '<span style="display:inline-block;background:#dc3545;color:#fff;font-size:0.85rem;font-weight:600;padding:5px 12px;border-radius:20px;margin-bottom:20px;"><i class="fas fa-times-circle"></i> Rupture de stock</span>';

        document.title = `${rawName} - NUMU D`;

        container.innerHTML = `
            <a href="collections.html" style="display:inline-block; margin-bottom:20px; color:var(--secondary);"><i class="fas fa-arrow-left"></i> Retour aux collections</a>
            <div class="detail-grid">
                <div class="detail-image-container">
                    <div class="gallery-main-wrap">
                        <img id="detail-main-image" src="${images[0]}" alt="${safeName}" class="detail-image" loading="lazy">
                        ${images.length > 1 ? `
                        <button type="button" class="gallery-nav-btn gallery-prev" aria-label="Image precedente"><i class="fas fa-chevron-left"></i></button>
                        <button type="button" class="gallery-nav-btn gallery-next" aria-label="Image suivante"><i class="fas fa-chevron-right"></i></button>
                        <span class="gallery-counter" id="gallery-counter">1 / ${images.length}</span>` : ''}
                    </div>
                    ${images.length > 1 ? `
                    <div class="gallery-thumbs" id="gallery-thumbs">
                        ${images.map((img, index) => `<button type="button" class="gallery-thumb${index === 0 ? ' active' : ''}" data-index="${index}"><img src="${img}" alt="${safeName} ${index + 1}" loading="lazy"></button>`).join('')}
                    </div>` : ''}
                </div>
                <div class="detail-info">
                    <div class="detail-category">${safeCategory}</div>
                    <h1 class="detail-title">${safeName}</h1>
                    ${badge}
                    ${safePrice ? `<div class="detail-price">${safePrice} CFA</div>` : ''}
                    <div class="detail-desc">${safeDescription}</div>
                    <div class="detail-actions">
                        ${isAvailable
                            ? `<a href="https://wa.me/22379798513?text=${orderMessage}" target="_blank" rel="noopener" class="btn btn-whatsapp"><i class="fab fa-whatsapp"></i> Commander</a>`
                            : '<button class="btn" style="background:#ccc;color:#777;cursor:not-allowed;" disabled><i class="fas fa-times-circle"></i> Indisponible</button>'
                        }
                        <a href="collections.html" class="btn btn-outline">Voir les collections</a>
                    </div>
                    ${paymentSelector}
                    <div class="payment-methods">
                        <h3>Moyens de commande</h3>
                        <div class="payment-icons">
                            <i class="fab fa-whatsapp" title="Commande via WhatsApp"></i>
                            <i class="fas fa-envelope" title="Commande par E-mail"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (images.length > 1) initGallery(images);
    }

    function initGallery(images) {
        const mainImage = document.getElementById('detail-main-image');
        const counter = document.getElementById('gallery-counter');
        const thumbsContainer = document.getElementById('gallery-thumbs');
        const prevBtn = container.querySelector('.gallery-prev');
        const nextBtn = container.querySelector('.gallery-next');
        let currentIndex = 0;

        function showImage(index) {
            currentIndex = (index + images.length) % images.length;
            mainImage.src = images[currentIndex];

            if (counter) counter.textContent = `${currentIndex + 1} / ${images.length}`;

            if (thumbsContainer) {
                thumbsContainer.querySelectorAll('.gallery-thumb').forEach((thumb, thumbIndex) => {
                    thumb.classList.toggle('active', thumbIndex === currentIndex);
                });
            }
        }

        if (thumbsContainer) {
            thumbsContainer.addEventListener('click', (event) => {
                const thumb = event.target.closest('.gallery-thumb');
                if (!thumb) return;
                showImage(Number(thumb.getAttribute('data-index')));
            });
        }

        if (prevBtn) prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => showImage(currentIndex + 1));
    }
});
