/**
 * NUMU D - Legacy article page
 */

document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('article-wrapper');
    const message = `
        <div class="error-message">
            Cette rubrique est maintenant remplacée par <a href="blog.html">La galerie</a>.
        </div>`;

    if (wrapper) {
        wrapper.innerHTML = message;
    } else {
        window.location.href = 'blog.html';
    }
});
