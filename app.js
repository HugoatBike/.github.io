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
            let devices = await navigator.bluetooth.getDevices();
            if (devices.length === 0) {
                device = await navigator.bluetooth.requestDevice({
                    filters: [{ services: [serviceUuid] }],
                    optionalServices: ['battery_service']
                });
            } else {
                device = devices[0];
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
    // ⚠️ CRUCIAL : Web Bluetooth exige un 'click' classique pour ouvrir la boîte de dialogue
    const btnBluetooth = document.getElementById('btn-bluetooth');
    if (btnBluetooth) {
        btnBluetooth.replaceWith(btnBluetooth.cloneNode(true)); // Nettoie les anciens écouteurs résiduels
    }

    document.getElementById('btn-bluetooth').addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Clic détecté sur le bouton Bluetooth");
        await handleBluetoothToggle();
    });

    // Les zones de jeu peuvent rester en tactile rapide (pointerdown) car elles n'ouvrent pas de fenêtre
    document.getElementById('zone-p1').addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sendCmd('p1_accel');
    });

    document.getElementById('zone-p2').addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sendCmd('p2_accel');
    });

    document.getElementById('btn-reset-game').addEventListener('click', () => {
        sendCmd('reset');
    });
}


function updateConnectionStatus(isConnected) {
    const statusEl = document.getElementById('status');
    const btnBluetooth = document.getElementById('btn-bluetooth');
    if (isConnected) {
        statusEl.innerText = "Connecté";
        statusEl.style.color = "#2ed573";
        btnBluetooth.innerText = "🔌 Déconnecter";
        btnBluetooth.style.backgroundColor = "#747d8c";
    } else {
        statusEl.innerText = "Déconnecté";
        statusEl.style.color = "#ff4757";
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
