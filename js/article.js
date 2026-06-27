/**
 * NUMU D - Article Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    const wrapper = document.getElementById('article-wrapper');
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (!articleId) {
        wrapper.innerHTML = '<div class="error-message">Aucun article spécifié. <a href="blog.html">Retour au blog</a></div>';
        return;
    }

    try {
        const allData = await window.NUMUD.fetchJSON(CONFIG.blogApi);
        const data = allData.filter(item => item.Id === articleId || item.Id == articleId);

        if (!data || data.length === 0) {
            wrapper.innerHTML = '<div class="error-message">Article introuvable. <a href="blog.html">Retour au blog</a></div>';
            return;
        }

        const article = data[0];
        const title = article.Titre || article.Tittre || 'Article NUMU D';
        const safeTitle = window.NUMUD.escapeHTML(title);
        const safeAuthor = window.NUMUD.escapeHTML(article.Auteur || 'Équipe NUMU D');
        const safeDate = window.NUMUD.escapeHTML(formatDate(article.Date));
        const safeCategory = article.Categorie ? `<span><i class="far fa-folder"></i> ${window.NUMUD.escapeHTML(article.Categorie)}</span>` : '';
        const safeImage = window.NUMUD.safeImageUrl(article.Image, '');
        const contentHTML = article.Contenu ? window.NUMUD.nl2br(article.Contenu).replace(/(<br>){2,}/g, '</p><p>') : '';

        document.title = `${title} - Blog NUMU D`;

        wrapper.innerHTML = `
            <a href="blog.html" style="display:inline-block; margin-bottom:20px; color:var(--secondary);"><i class="fas fa-arrow-left"></i> Retour au blog</a>
            <div class="article-container">
                <header class="article-header">
                    <h1 class="article-title">${safeTitle}</h1>
                    <div class="article-meta">
                        <span><i class="far fa-calendar-alt"></i> ${safeDate}</span>
                        <span><i class="far fa-user"></i> ${safeAuthor}</span>
                        ${safeCategory}
                    </div>
                </header>

                ${safeImage ? `<img src="${safeImage}" alt="${safeTitle}" class="article-hero-img">` : ''}

                <div class="article-content">
                    <p>${contentHTML}</p>
                </div>

                <div class="share-section">
                    <strong>Partager cet article :</strong>
                    <a href="#" class="share-btn" id="share-facebook"><i class="fab fa-facebook-f"></i></a>
                    <a href="#" class="share-btn" id="share-twitter"><i class="fab fa-twitter"></i></a>
                    <a href="#" class="share-btn" id="share-whatsapp"><i class="fab fa-whatsapp"></i></a>
                </div>
            </div>
        `;

        document.getElementById('share-facebook').addEventListener('click', (event) => {
            event.preventDefault();
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
        });
        document.getElementById('share-twitter').addEventListener('click', (event) => {
            event.preventDefault();
            window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(title)}`, '_blank');
        });
        document.getElementById('share-whatsapp').addEventListener('click', (event) => {
            event.preventDefault();
            window.open(`https://wa.me/?text=${encodeURIComponent(title + ' - ' + window.location.href)}`, '_blank');
        });

    } catch (error) {
        console.error('Fetch error:', error);
        wrapper.innerHTML = '<div class="error-message">Impossible de charger l\'article. Veuillez réessayer plus tard.</div>';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        try {
            return new Date(dateStr).toLocaleDateString('fr-FR', options);
        } catch (error) {
            return dateStr;
        }
    }
});
