/**
 * NUMU D - Collections Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    const gridContainer = document.getElementById('collections-grid');
    const filtersContainer = document.getElementById('filters-container');
    let allProducts = [];

    if (!gridContainer || !filtersContainer) return;

    try {
        allProducts = await window.NUMUD.fetchJSON(CONFIG.collectionsApi);

        if (allProducts.length === 0) {
            gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Aucune collection disponible pour le moment.</p>';
            return;
        }

        const categories = ['Tout', ...new Set(allProducts.map(item => item.Categorie).filter(Boolean))];
        renderFilters(categories);
        renderProducts(allProducts);

    } catch (error) {
        console.error('Fetch error:', error);
        gridContainer.innerHTML = '<div class="error-message" style="grid-column: 1/-1;">Impossible de charger les collections. Veuillez réessayer plus tard.</div>';
    }

    function renderFilters(categories) {
        filtersContainer.innerHTML = categories.map((cat, index) =>
            `<button class="filter-btn ${index === 0 ? 'active' : ''}" data-filter-index="${index}">${window.NUMUD.escapeHTML(cat)}</button>`
        ).join('');

        filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                filtersContainer.querySelectorAll('.filter-btn').forEach(button => button.classList.remove('active'));
                event.target.classList.add('active');

                const category = categories[Number(event.target.getAttribute('data-filter-index'))];
                renderProducts(category === 'Tout' ? allProducts : allProducts.filter(item => item.Categorie === category));
            });
        });
    }

    function renderProducts(products) {
        if (products.length === 0) {
            gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Aucun produit ne correspond à ce filtre.</p>';
            return;
        }

        gridContainer.innerHTML = products.map(item => window.NUMUD.renderProductCard(item)).join('');
    }
});
