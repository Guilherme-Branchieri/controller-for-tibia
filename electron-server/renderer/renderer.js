const qrImg = document.getElementById('qr');
const ipText = document.getElementById('ip');
const statusText = document.getElementById('status');

window.api.onServerInfo((data) => {
  qrImg.src = data.qr;
  ipText.innerText = `ws://${data.ip}:${data.port}`;
});

window.api.onConnectionStatus((connected) => {
  if (connected) {
    statusText.innerText = "● Conectado";
    statusText.classList.remove('disconnected');
    statusText.classList.add('connected');
  } else {
    statusText.innerText = "● Desconectado";
    statusText.classList.remove('connected');
    statusText.classList.add('disconnected');
  }
});