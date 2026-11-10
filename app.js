// UUID bluetooth du service Nordic UART utilisé pour communiquer avec l'équipement bluetooth
const serviceUuid = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';

// Canal de transmission des commandes texte vers l'équipement bluetooth
var tx = null;

// Équipement bluetooth
let device = null;

function init() {
    if (!('bluetooth' in navigator)) {
        alert('Désolé, votre navigateur ne supporte pas le bluetooth. Ouvrez cette app en HTTPS sur un navigateur compatible (ex: Chrome sur Android).');
        return;
    }
    setupMobileControls();
}

async function handleBluetoothToggle() {
    // Si l'appareil est déjà connecté, on gère la déconnexion
    if (device && device.gatt && device.gatt.connected) {
        try {
            await device.gatt.disconnect();
            console.log("Déconnecté manuellement");
        } catch (err) {
            console.error("Erreur lors de la déconnexion :", err);
        }
        device = null;
        tx = null;
        updateConnectionStatus(false);
        return;
    }

    console.log("Tentative de connexion à HugoPico...");
    try {
        // Recherche brute filtrée par le Service UUID Nordic UART
        // L'utilisateur choisit l'appareil dans la fenêtre native de Chrome
        device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [serviceUuid] }],
            optionalServices: ['battery_service']
        });

        if (!device) {
            console.log("Sélection annulée par l'utilisateur.");
            return;
        }

        console.log("Connexion au serveur GATT pour : " + device.name);
        const server = await device.gatt.connect();
        
        console.log("Obtention du service...");
        const service = await server.getPrimaryService(serviceUuid);
        
        console.log("Obtention de la caractéristique TX...");
        tx = await service.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e');
        
        console.log("Canal de transmission activé avec succès !");
        updateConnectionStatus(true);

    } catch (error) {
        console.error('Erreur de connexion Bluetooth :', error);
        device = null;
        tx = null;
        updateConnectionStatus(false);
        alert('Échec de la connexion. Assurez-vous que HugoPico est allumé et non connecté à un autre téléphone.');
    }
}

async function sendCmd(cmd) {
    if (!tx) {
        console.warn("Commande ignorée : l'application n'est pas connectée à HugoPico.");
        return; 
    }
    
    try {
        cmd = cmd.toLowerCase() + '\n'; // Saut de line requis pour la lecture série des cartes
        const encoder = new TextEncoder();
        const cmdBytes = encoder.encode(cmd);
        await tx.writeValue(cmdBytes);
        console.log("Commande envoyée avec succès :", cmd.trim());
    } catch (error) {
        console.error("Erreur lors de l'envoi de la commande :", error);
    }
}

function setupMobileControls() {
    // ⚠️ SÉCURITÉ CHROME : Impératif d'utiliser 'click' pour le Bluetooth
    const btnBluetooth = document.getElementById('btn-bluetooth');
    if (btnBluetooth) {
        // Nettoyage préventif des écouteurs précédents
        btnBluetooth.replaceWith(btnBluetooth.cloneNode(true));
    }

    document.getElementById('btn-bluetooth').addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleBluetoothToggle();
    });

    // Événements tactiles haute performance pour les boutons de course
    document.getElementById('zone-p1').addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sendCmd('p1_accel');
    });

    document.getElementById('zone-p2').addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sendCmd('p2_accel');
    });

    // Reset du jeu
    document.getElementById('btn-reset-game').addEventListener('click', (e) => {
        e.preventDefault();
        sendCmd('reset');
    });
}

function updateConnectionStatus(isConnected) {
    const statusEl = document.getElementById('status');
    const nameEl = document.getElementById('device-connected-name');
    const btnBluetooth = document.getElementById('btn-bluetooth');
    
    if (isConnected && device) {
        statusEl.innerText = "Connecté à :";
        statusEl.style.color = "#2ed573";
        nameEl.innerText = device.name ? device.name : "HugoPico";
        btnBluetooth.innerText = "🔌 Déconnecter";
        btnBluetooth.style.backgroundColor = "#747d8c";
    } else {
        statusEl.innerText = "Déconnecté";
        statusEl.style.color = "#ff4757";
        nameEl.innerText = "";
        btnBluetooth.innerText = "🔗 Bluetooth";
        btnBluetooth.style.backgroundColor = "#0084ff";
    }
}

// Enregistrement du Service Worker avec le chemin relatif './' pour GitHub Pages
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('./service-worker.js').then(function (registration) {
            console.log('Service Worker registered successfully');
        }).catch(function (err) {
            console.log('Service Worker registration failed: ', err);
        });
    });
}

// Lancement automatique
init();
