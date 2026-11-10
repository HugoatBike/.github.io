const serviceUuid = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
var tx = null;
let device = null;

function init() {
    if (!('bluetooth' in navigator)) {
        alert('Désolé, votre navigateur ne supporte pas le bluetooth. Ouvrez cette app sur un navigateur compatible mobile (ex: Chrome sur Android).');
        return;
    }
    setupMobileControls();
}

async function handleBluetoothToggle() {
    if (device && device.gatt.connected) {
        await device.gatt.disconnect();
        console.log("Déconnecté");
        updateConnectionStatus(false);
    } else {
        console.log("Tentative de connexion...");
        try {
            // Demande d'accès ou récupération des périphériques connus
            async function connect() {
    console.log("connect called");
    try {
        let devices = await navigator.bluetooth.getDevices();
        
        // Si le téléphone ne se rappelle d'aucun appareil, on lance une recherche fraîche
        if (devices.length === 0) {
            console.log("Aucun appareil en cache. Lancement de pair()...");
            device = await pair();
        } else {
            // On récupère le périphérique que l'utilisateur a déjà associé
            device = devices[0]; 
        }

        if (!device) {
            console.log("Connexion annulée par l'utilisateur ou aucun appareil choisi.");
            return;
        }

        console.log("Connexion au serveur GATT pour : " + (device.name || "Appareil sans nom"));
        const server = await device.gatt.connect();
        
        const service = await server.getPrimaryService(serviceUuid);
        tx = await service.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e');
        
        console.log("Canal de transmission activé !");
        updateConnectionStatus(true);
    }
    catch (error) {
        console.error('Erreur de connexion Bluetooth : ', error);
        updateConnectionStatus(false);
        
        // Si le cache est corrompu ou l'appareil hors de portée, on force une nouvelle recherche au clic suivant
        device = null; 
    }
}


            const server = await device.gatt.connect();
            const service = await server.getPrimaryService(serviceUuid);
            tx = await service.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e');
            
            updateConnectionStatus(true);
        } catch (error) {
            console.error('Erreur de connexion Bluetooth:', error);
            updateConnectionStatus(false);
        }
    }
}

async function sendCmd(cmd) {
    if (!tx) return; // Ne bloque pas l'application visuellement si pas connecté
    cmd = cmd.toLowerCase() + '\n';
    const encoder = new TextEncoder();
    const cmdBytes = encoder.encode(cmd);
    await tx.writeValue(cmdBytes);
}

function setupMobileControls() {
    // Gestion unique du bouton de connexion Bluetooth (Toggle)
    document.getElementById('btn-bluetooth').addEventListener('click', handleBluetoothToggle);

    // Événements tactiles haute performance (pointerdown) pour la course
    document.getElementById('zone-p1').addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sendCmd('p1_accel');
    });

    document.getElementById('zone-p2').addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sendCmd('p2_accel');
    });

    // Reset du jeu
    document.getElementById('btn-reset-game').addEventListener('click', () => {
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
        
        // Récupère le nom de l'appareil, ou affiche "Appareil Inconnu" s'il n'a pas de nom public
        nameEl.innerText = device.name ? device.name : "Appareil sans nom";
        
        btnBluetooth.innerText = "🔌 Déconnecter";
        btnBluetooth.style.backgroundColor = "#747d8c";
    } else {
        statusEl.innerText = "Déconnecté";
        statusEl.style.color = "#ff4757";
        
        // Efface le nom de l'appareil lors de la déconnexion
        nameEl.innerText = "";
        
        btnBluetooth.innerText = "🔗 Bluetooth";
        btnBluetooth.style.backgroundColor = "#0084ff";
    }
}


// Service Worker (votre code d'origine pour le mode PWA/téléphone offline)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('./service-worker.js').then(function (registration) {
            console.log('Service Worker registered');
        }).catch(function (err) {
            console.log('Service Worker registration failed: ', err);
        });
    });
}

init();
