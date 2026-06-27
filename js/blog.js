/**
 * NUMU D - Blog Logic
 */

const BLOG_CATEGORIES = [
    'Tout',
    'Le pagne tissé au Mali',
    'Les artisans partenaires',
    'Les coulisses d\'une collection',
    'Résidence à Ségou',
    'Festival sur le Niger'
];

document.addEventListener('DOMContentLoaded', async () => {
    const gridContainer = document.getElementById('blog-grid');
    const filtersContainer = document.getElementById('blog-filters');
    let allArticles = [];

    try {
        allArticles = await window.NUMUD.fetchJSON(CONFIG.blogApi);

        if (!allArticles || allArticles.length === 0) {
            gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Aucun article disponible pour le moment.</p>';
            return;
        }

        allArticles.sort((a, b) => new Date(b.Date) - new Date(a.Date));

        if (filtersContainer) renderFilters();
        renderArticles(allArticles);

    } catch (error) {
        console.error('Fetch error:', error);
        gridContainer.innerHTML = '<div class="error-message" style="grid-column: 1/-1;">Impossible de charger les articles du blog. Veuillez réessayer plus tard.</div>';
    }

    function renderFilters() {
        filtersContainer.innerHTML = BLOG_CATEGORIES.map((cat, index) =>
            `<button class="filter-btn ${index === 0 ? 'active' : ''}" data-filter-index="${index}">${window.NUMUD.escapeHTML(cat)}</button>`
        ).join('');

        filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const category = BLOG_CATEGORIES[Number(e.target.getAttribute('data-filter-index'))];
                renderArticles(category === 'Tout' ? allArticles : allArticles.filter(a => a.Categorie === category));
            });
        });
    }

    function renderArticles(articles) {
        if (articles.length === 0) {
            gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Aucun article dans cette catégorie pour le moment.</p>';
            return;
        }

        gridContainer.innerHTML = articles.map(article => {
            const id = encodeURIComponent(article.Id || '');
            const title = window.NUMUD.escapeHTML(article.Titre || article.Tittre || 'Article NUMU D');
            const image = window.NUMUD.safeImageUrl(article.Image, 'https://via.placeholder.com/600x400?text=Blog+NUMU+D');
            const author = window.NUMUD.escapeHTML(article.Auteur || 'NUMU D');
            const category = article.Categorie ? `<span><i class="far fa-folder"></i> ${window.NUMUD.escapeHTML(article.Categorie)}</span>` : '';
            const excerpt = window.NUMUD.escapeHTML(article.Resume || window.NUMUD.truncate(article.Contenu || '', 100));

            return `
                <article class="blog-card">
                    <a href="article.html?id=${id}">
                        <img src="${image}" alt="${title}" class="blog-img" loading="lazy">
                    </a>
                    <div class="blog-content">
                        <div class="blog-meta">
                            <span><i class="far fa-calendar-alt"></i> ${window.NUMUD.escapeHTML(formatDate(article.Date))}</span>
                            <span><i class="far fa-user"></i> ${author}</span>
                            ${category}
                        </div>
                        <h2 class="blog-title"><a href="article.html?id=${id}">${title}</a></h2>
                        <p class="blog-excerpt">${excerpt}</p>
                        <a href="article.html?id=${id}" class="blog-read-more">Lire la suite <i class="fas fa-arrow-right"></i></a>
                    </div>
                </article>`;
        }).join('');
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        try {
            return new Date(dateStr).toLocaleDateString('fr-FR', options);
        } catch (e) {
            return dateStr;
        }
    }
});
