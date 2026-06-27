/**
 * NUMU D - Contact Form Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const msgBox = document.getElementById('contact-message');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get values
            const nom = document.getElementById('nom').value.trim();
            const email = document.getElementById('email').value.trim();
            const tel = document.getElementById('telephone').value.trim();
            const sujet = document.getElementById('sujet').value.trim();
            const message = document.getElementById('message').value.trim();
            const btn = document.getElementById('submit-btn');

            // Reset msg box
            msgBox.className = '';
            msgBox.textContent = '';

            // Basic validation
            if (!nom || !email || !sujet || !message) {
                showMsg('Veuillez remplir tous les champs obligatoires.', 'error');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showMsg('Veuillez entrer une adresse email valide.', 'error');
                return;
            }

            if (tel && !/^[+0-9\s]{8,15}$/.test(tel)) {
                showMsg('Veuillez entrer un numéro de téléphone valide.', 'error');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

            const date = new Date().toISOString().split('T')[0];
            const newId = Date.now().toString();

            fetch(CONFIG.contactApi, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: [{
                        "Id": newId,
                        "Nom": nom,
                        "Email": email,
                        "Telephone": tel,
                        "Sujet": sujet,
                        "Message": message,
                        "Date": date
                    }]
                })
            })
            .then(response => {
                if (!response.ok) throw new Error('Erreur réseau');
                return response.json();
            })
            .then(data => {
                showMsg('Votre message a été envoyé avec succès. Nous vous recontacterons bientôt.', 'success');
                form.reset();
            })
            .catch(error => {
                console.error('Error submitting contact form:', error);
                showMsg('Une erreur est survenue lors de l\'envoi. Veuillez réessayer.', 'error');
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = 'Envoyer le message';
            });
        });
    }

    function showMsg(text, type) {
        msgBox.textContent = text;
        msgBox.className = type;
        
        setTimeout(() => {
            msgBox.className = '';
            msgBox.textContent = '';
        }, 5000);
    }
});
