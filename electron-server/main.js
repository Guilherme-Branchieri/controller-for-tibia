const { app, BrowserWindow } = require('electron');
const path = require('path');
const os = require('os');
const WebSocket = require('ws');
const QRCode = require('qrcode');
const { spawn } = require('child_process');

let mainWindow;
let wss;
let currentClient = null;
let keyboardProcess;

const PORT = 3000;

// Detecta IP local automaticamente
function getLocalIP() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {

            const isIPv4 = iface.family === 'IPv4';
            const isInternal = iface.internal;
            const isValidRange =
                iface.address.startsWith('192.168.') ||
                iface.address.startsWith('10.') ||
                iface.address.startsWith('172.16.');

            if (isIPv4 && !isInternal && isValidRange) {
                return iface.address;
            }
        }
    }

    return '127.0.0.1';
}

const IP = getLocalIP();
const WS_URL = `ws://${IP}:${PORT}`;

// Inicia processo C++ persistente
function startKeyboardProcess() {

    let exePath;

    if (app.isPackaged) {
        // Quando estiver empacotado
        exePath = path.join(process.resourcesPath, 'keyboard-mapper.exe');
    } else {
        // Desenvolvimento
        exePath = path.join(__dirname, 'keyboard-mapper.exe');
    }

    keyboardProcess = spawn(path.join(__dirname, 'keyboard-mapper.exe'));

    keyboardProcess.on('error', (err) => {
        console.error('Erro ao iniciar keyboard.exe:', err);
    });

    keyboardProcess.on('exit', () => {
        console.log('keyboard-mapper.exe finalizado');
    });
}

function sendDirection(direction) {
    if (keyboardProcess) {
        keyboardProcess.stdin.write(direction + '\n');
    }
}

// Cria janela
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 500,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('renderer/index.html');
}

// Inicia servidor WebSocket
async function startServer() {
    wss = new WebSocket.Server({
        host: '0.0.0.0',
        port: PORT
    });

    wss.on('connection', (ws) => {

        // Permite apenas 1 cliente
        if (currentClient) {
            ws.close();
            return;
        }

        currentClient = ws;
        mainWindow.webContents.send('connection-status', true);

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());
                const direction = data.direction;

                console.log("DIRECTION:", direction);

                if (direction) {
                    sendDirection(direction);
                }

            } catch (err) {
                console.error("ERRO JSON:", err);
            }
        });

        ws.on('close', () => {
            sendDirection("stop");
            currentClient = null;
            mainWindow.webContents.send('connection-status', false);
        });
    });

    // Gera QR Code
    const qr = await QRCode.toDataURL(WS_URL);
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('server-info', {
            ip: IP,
            port: PORT,
            qr
        });
    });
}

process.on('exit', () => {
    if (keyboardProcess) {
        keyboardProcess.stdin.write("exit\n");
        keyboardProcess.kill();
    }
});

app.whenReady().then(() => {
    startKeyboardProcess();
    createWindow();
    startServer();
});

app.on('window-all-closed', () => {
    if (keyboardProcess) {
        keyboardProcess.stdin.write("exit\n");
        keyboardProcess.kill();
    }
    app.quit();
});