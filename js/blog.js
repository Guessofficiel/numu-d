/**
 * NUMU D - Gallery Logic
 * Recupere toutes les images de toutes les collections (colonne Image,
 * une ou plusieurs URLs separees par "|") pour alimenter la galerie generale.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const gridContainer = document.getElementById('blog-grid');
    const filtersContainer = document.getElementById('blog-filters');

    if (!gridContainer) return;

    let galleryItems = [];

    try {
        const collections = await window.NUMUD.fetchJSON(CONFIG.collectionsApi);
        galleryItems = buildGalleryItems(collections);
    } catch (error) {
        console.error('Fetch error:', error);
        gridContainer.innerHTML = '<div class="error-message" style="grid-column: 1/-1;">Impossible de charger la galerie. Veuillez réessayer plus tard.</div>';
        return;
    }

    if (galleryItems.length === 0) {
        gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Aucune image disponible pour le moment.</p>';
        if (filtersContainer) filtersContainer.style.display = 'none';
        return;
    }

    const categories = ['Tout', ...new Set(galleryItems.map(item => item.category).filter(Boolean))];
    renderFilters(categories);
    renderGallery(galleryItems);

    function buildGalleryItems(collections) {
        const items = [];

        collections.forEach(item => {
            const images = window.NUMUD.getImages(item);
            if (images.length === 0) return;

            const title = window.NUMUD.getField(item, ['Nom', 'Nom produit', 'Produit', 'Titre'], 'Produit NUMU D');
            const category = window.NUMUD.getField(item, ['Univers', 'Universe'], '')
                || window.NUMUD.getField(item, ['Categorie', 'Catégorie', 'Category'], '');

            images.forEach(image => items.push({ title, category, image }));
        });

        return items;
    }

    function renderFilters(categoriesList) {
        if (!filtersContainer) return;

        filtersContainer.innerHTML = categoriesList.map((category, index) =>
            `<button class="filter-btn ${index === 0 ? 'active' : ''}" data-filter-index="${index}">${window.NUMUD.escapeHTML(category)}</button>`
        ).join('');

        filtersContainer.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                filtersContainer.querySelectorAll('.filter-btn').forEach(item => item.classList.remove('active'));
                event.currentTarget.classList.add('active');

                const category = categoriesList[Number(event.currentTarget.getAttribute('data-filter-index'))];
                renderGallery(category === 'Tout'
                    ? galleryItems
                    : galleryItems.filter(item => item.category === category)
                );
            });
        });
    }

    function renderGallery(items) {
        gridContainer.innerHTML = items.map(item => {
            const title = window.NUMUD.escapeHTML(item.title);
            const category = window.NUMUD.escapeHTML(item.category);

            return `
                <article class="blog-card">
                    <img src="${item.image}" alt="${title}" class="blog-img" loading="lazy">
                    <div class="blog-content">
                        <div class="blog-meta">
                            <span><i class="far fa-image"></i> ${category}</span>
                        </div>
                        <h2 class="blog-title">${title}</h2>
                    </div>
                </article>`;
        }).join('');
    }
});
