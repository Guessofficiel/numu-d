/**
 * NUMU D - Gallery Logic
 */

const GALLERY_ITEMS = [
    {
        title: 'Portrait de la créatrice',
        category: 'Créatrice',
        image: 'assets/images/creatrice.jpeg'
    },
    {
        title: 'Démarche artistique',
        category: 'Matières',
        image: 'assets/images/Demarche artistique.jpeg'
    },
    {
        title: 'Univers artisanal NUMU D',
        category: 'Atelier',
        image: 'assets/images/hero_bg_new.jpg'
    },
    {
        title: 'Savoir-faire textile',
        category: 'Matières',
        image: 'assets/images/Demarche 2.jpeg'
    },
    {
        title: 'Artisans partenaires',
        category: 'Atelier',
        image: 'assets/images/Artisant partenaire.jpeg'
    },
    {
        title: 'Référence NUMU D',
        category: 'Références',
        image: 'assets/images/Reference 1.jpeg'
    },
    {
        title: 'Sirandou Dianka',
        category: 'Créatrice',
        image: 'assets/images/sirandou_dianka.png'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('blog-grid');
    const filtersContainer = document.getElementById('blog-filters');

    if (!gridContainer) return;

    const categories = ['Tout', ...new Set(GALLERY_ITEMS.map(item => item.category))];
    renderFilters(categories);
    renderGallery(GALLERY_ITEMS);

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
                    ? GALLERY_ITEMS
                    : GALLERY_ITEMS.filter(item => item.category === category)
                );
            });
        });
    }

    function renderGallery(items) {
        gridContainer.innerHTML = items.map(item => {
            const title = window.NUMUD.escapeHTML(item.title);
            const category = window.NUMUD.escapeHTML(item.category);
            const image = window.NUMUD.safeImageUrl(item.image, '');

            return `
                <article class="blog-card">
                    <img src="${image}" alt="${title}" class="blog-img" loading="lazy">
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
