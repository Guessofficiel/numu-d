/**
 * NUMU D - Univers Products Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    const gridContainer = document.getElementById('collections-grid');
    const filtersContainer = document.getElementById('filters-container');
    const universFilter = document.body.dataset.univers;

    if (!universFilter || !gridContainer) return;

    let allProducts = [];

    try {
        const data = await window.NUMUD.fetchJSON(CONFIG.collectionsApi);
        allProducts = filterProductsByUniverse(data, universFilter);

        if (allProducts.length === 0) {
            gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Aucune piece disponible pour le moment.</p>';
            if (filtersContainer) filtersContainer.style.display = 'none';
            return;
        }

        const categories = ['Tout', ...new Set(allProducts.map(item => window.NUMUD.getField(item, ['Categorie', 'Catégorie', 'Category'])).filter(Boolean))];
        if (filtersContainer) renderFilters(categories);
        renderProducts(allProducts);

    } catch (error) {
        console.error('Fetch error:', error);
        gridContainer.innerHTML = '<div class="error-message" style="grid-column: 1/-1;">Aucune piece disponible pour le moment.</div>';
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
                const products = category === 'Tout' ? allProducts : allProducts.filter(item => window.NUMUD.getField(item, ['Categorie', 'Catégorie', 'Category']) === category);
                renderProducts(products);
            });
        });
    }

    function renderProducts(products) {
        if (products.length === 0) {
            gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Aucun produit ne correspond a ce filtre.</p>';
            return;
        }

        gridContainer.innerHTML = products.map(item => window.NUMUD.renderProductCard(item)).join('');
    }
});
