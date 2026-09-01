/**
 * NUMU D - Sauvegarde quotidienne des donnees SheetDB
 * Recupere chaque feuille utilisee par le site et les regroupe dans
 * data/sheetdb-backup.json. Execute par la GitHub Action backup-sheetdb.yml.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SHEETS = {
    collections: 'https://sheetdb.io/api/v1/0xyocxqh5qb59?sheet=Collections',
    newsletters: 'https://sheetdb.io/api/v1/0xyocxqh5qb59?sheet=Newsletters',
    contacts: 'https://sheetdb.io/api/v1/0xyocxqh5qb59?sheet=Contacts',
    commandes: 'https://sheetdb.io/api/v1/0xyocxqh5qb59?sheet=Commandes',
    surMesure: 'https://sheetdb.io/api/v1/0xyocxqh5qb59?sheet=SurMesure'
};

const OUTPUT_PATH = path.join(__dirname, '..', '..', 'data', 'sheetdb-backup.json');

function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                reject(new Error(`${url} a repondu ${res.statusCode}`));
                res.resume();
                return;
            }

            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    reject(new Error(`Reponse invalide pour ${url}: ${error.message}`));
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    const backup = { generatedAt: new Date().toISOString() };
    let successCount = 0;

    for (const [key, url] of Object.entries(SHEETS)) {
        try {
            backup[key] = await fetchJSON(url);
            successCount += 1;
        } catch (error) {
            console.warn(`Feuille "${key}" ignoree : ${error.message}`);
            backup[key] = { error: error.message };
        }
    }

    if (successCount === 0) {
        throw new Error('Aucune feuille SheetDB n\'a pu etre recuperee.');
    }

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(backup, null, 2) + '\n');
    console.log(`Sauvegarde ecrite dans ${OUTPUT_PATH} (${successCount}/${Object.keys(SHEETS).length} feuilles recuperees)`);
}

main().catch((error) => {
    console.error('Echec de la sauvegarde SheetDB :', error);
    process.exit(1);
});
