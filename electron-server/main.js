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
            if (isIPv4 && !isInternal && isValidRange) return iface.address;
        }
    }
    return '127.0.0.1';
}

const IP = getLocalIP();
const WS_URL = `ws://${IP}:${PORT}`;

function startKeyboardProcess() {
    // ✅ FIX: usa exePath no spawn (não __dirname fixo)
    const exePath = app.isPackaged
        ? path.join(process.resourcesPath, 'keyboard-mapper.exe')
        : path.join(__dirname, 'keyboard-mapper.exe');

    console.log("Iniciando keyboard-mapper.exe em:", exePath);
    keyboardProcess = spawn(exePath, [], { windowsHide: true });

    keyboardProcess.stdout.on('data', (d) => console.log('[keyboard-mapper]', d.toString().trim()));
    keyboardProcess.stderr.on('data', (d) => console.error('[keyboard-mapper ERR]', d.toString().trim()));
    keyboardProcess.on('error', (err) => console.error('Erro ao iniciar keyboard-mapper.exe:', err));
    keyboardProcess.on('exit', (code) => console.log(`keyboard-mapper.exe finalizado (${code})`));
}

function sendCommand(command) {
    if (keyboardProcess?.stdin?.writable) {
        keyboardProcess.stdin.write(command + '\n');
    }
}

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

async function startServer() {
    wss = new WebSocket.Server({ host: '0.0.0.0', port: PORT });

    wss.on('connection', (ws) => {
        // ✅ FIX: encerra cliente antigo em vez de rejeitar o novo
        if (currentClient) currentClient.close();

        currentClient = ws;
        mainWindow.webContents.send('connection-status', true);

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());

                if (data.direction) {
                    console.log('DIRECTION:', data.direction);
                    sendCommand(data.direction);
                } else if (data.action) {
                    console.log('ACTION:', data.action);
                    sendCommand(data.action);
                }
            } catch (err) {
                console.error("ERRO JSON:", err);
            }
        });

        ws.on('close', () => {
            // ✅ FIX: só limpa se for o cliente atual
            if (currentClient === ws) {
                sendCommand("stop");
                currentClient = null;
                mainWindow.webContents.send('connection-status', false);
            }
        });
    });

    // ✅ FIX: envia QR Code corretamente independente do timing
    const qr = await QRCode.toDataURL(WS_URL);
    if (mainWindow.webContents.isLoading()) {
        mainWindow.webContents.once('did-finish-load', () => {
            mainWindow.webContents.send('server-info', { ip: IP, port: PORT, qr });
        });
    } else {
        mainWindow.webContents.send('server-info', { ip: IP, port: PORT, qr });
    }
}

function cleanup() {
    if (keyboardProcess) {
        try { keyboardProcess.stdin.write("exit\n"); } catch (_) {}
        keyboardProcess.kill();
    }
}

process.on('exit', cleanup);

app.whenReady().then(() => {
    startKeyboardProcess();
    createWindow();
    startServer();
});

app.on('window-all-closed', () => {
    cleanup();
    app.quit();
});