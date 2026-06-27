/**
 * NUMU D - Newsletter Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('newsletter-form');
    const messageEl = document.getElementById('nl-message');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('nl-name').value.trim();
            const email = document.getElementById('nl-email').value.trim();
            const btn = form.querySelector('button');
            
            if (!name || !email) {
                showMessage('Veuillez remplir tous les champs.', 'error');
                return;
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showMessage('Veuillez entrer une adresse email valide.', 'error');
                return;
            }

            try {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
                
                // 1. Check for duplicates
                const checkRes = await fetch(CONFIG.newsletterApi);
                const allEmails = await checkRes.json();
                const existing = allEmails.filter(e => e.Email && e.Email.toLowerCase() === email.toLowerCase());
                
                if (existing && existing.length > 0) {
                    showMessage('Cette adresse email est déjà inscrite.', 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'S\'abonner';
                    return;
                }

                // 2. Add new subscriber
                const date = new Date().toISOString().split('T')[0];
                const newId = Date.now().toString(); // Generate simple ID
                
                const response = await fetch(CONFIG.newsletterApi, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        data: [
                            {
                                "Id": newId,
                                "Nom": name,
                                "Email": email,
                                "Date": date
                            }
                        ]
                    })
                });

                if (!response.ok) throw new Error('Erreur réseau');

                showMessage('Merci pour votre inscription !', 'success');
                form.reset();

            } catch (error) {
                console.error(error);
                showMessage('Une erreur est survenue. Veuillez réessayer.', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'S\'abonner';
            }
        });
    }

    function showMessage(msg, type) {
        messageEl.textContent = msg;
        messageEl.style.color = type === 'error' ? '#d9534f' : '#28a745';
        
        setTimeout(() => {
            messageEl.textContent = '';
        }, 5000);
    }
});
