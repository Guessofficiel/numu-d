/**
 * NUMU D - Sur Mesure Form Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('sur-mesure-form');
    const msgBox = document.getElementById('sur-mesure-message');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nom = document.getElementById('sm-nom').value.trim();
        const telephone = document.getElementById('sm-telephone').value.trim();
        const email = document.getElementById('sm-email').value.trim();
        const typeDemande = document.getElementById('sm-type').value.trim();
        const description = document.getElementById('sm-description').value.trim();
        const btn = document.getElementById('sm-submit-btn');

        msgBox.className = '';
        msgBox.textContent = '';

        if (!nom || !email || !typeDemande || !description) {
            showMsg('Veuillez remplir tous les champs obligatoires.', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMsg('Veuillez entrer une adresse email valide.', 'error');
            return;
        }

        if (telephone && !/^[+0-9\s]{8,15}$/.test(telephone)) {
            showMsg('Veuillez entrer un numéro de téléphone valide.', 'error');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

        const date = new Date().toISOString().split('T')[0];
        const newId = Date.now().toString();

        fetch(CONFIG.surMesureApi, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: [{
                    "Id": newId,
                    "Nom": nom,
                    "Telephone": telephone,
                    "Email": email,
                    "Type_de_demande": typeDemande,
                    "Description": description,
                    "Date": date
                }]
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Erreur réseau');
            return response.json();
        })
        .then(() => {
            showMsg('Votre demande a été envoyée avec succès. Nous vous recontacterons sous peu.', 'success');
            form.reset();
        })
        .catch(error => {
            console.error('Error submitting sur mesure form:', error);
            showMsg('Une erreur est survenue lors de l\'envoi. Veuillez réessayer.', 'error');
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = 'Envoyer ma demande';
        });
    });

    function showMsg(text, type) {
        msgBox.textContent = text;
        msgBox.className = type;

        setTimeout(() => {
            msgBox.className = '';
            msgBox.textContent = '';
        }, 5000);
    }
});
