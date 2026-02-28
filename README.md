# Controller for Tibia 🎮

A mobile controller app for OT Server clients with built-in healer/shooter. Control your character using your Android phone as a gamepad — no extra hardware required.

## Architecture

```
Android App (React Native/Expo)
        │
        │  WebSocket (Wi-Fi)
        ▼
Electron Server (Windows)
        │
        │  stdin/stdout
        ▼
keyboard-mapper.exe (Python + Interception driver)
        │
        │  Kernel-level input injection
        ▼
Game Client
```

## Project Structure

```
remote-joystick/
├── react-native-client/     # Android app (Expo)
├── electron-server/         # Desktop server (Electron)
└── native-keyboard/         # Input injector (Python + Interception)
```

---

## Prerequisites

### Windows (Desktop)
- Node.js 18+
- Python 3.10+
- [Interception Driver](https://github.com/oblitum/Interception/releases) — required for kernel-level input injection

### Android App
- Node.js 18+
- Expo CLI
- EAS CLI (`npm install -g eas-cli`)

---

## Setup

### 1. Install Interception Driver

> ⚠️ Required once per machine. Needs reboot.

```powershell
# Run as Administrator
cd path\to\interception\installer
.\install-interception.exe /install
# Reboot your PC
```

### 2. Open Firewall Port 3000

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Joystick WebSocket" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### 3. Electron Server

```bash
cd electron-server
npm install
npm start
```

### 4. Build keyboard-mapper.exe

```bash
cd native-keyboard
pip install interception-python pyinstaller

# Build executable
python -M Pyinstaller --onefile --noconsole keyboard-mapper.py

# Copy to electron-server
cp dist/keyboard-mapper.exe ../electron-server/keyboard-mapper.exe
```

### 5. Android App — Development

```bash
cd react-native-client
npm install
npx expo start
```

Scan the QR code with Expo Go.

### 6. Android App — Production Build

```bash
cd react-native-client

# Cloud build (first time or after native changes)
eas build -p android --profile preview

# Local build (faster, requires WSL2 + Android SDK)
eas build -p android --profile preview --local

# JS-only update (after code changes, no rebuild needed)
eas update --branch preview --message "your update message"
```

---

## WSL2 Setup for Local Builds

```bash
# Install Android SDK inside WSL2
sudo apt update && sudo apt install -y wget unzip openjdk-17-jdk

mkdir -p ~/android-sdk/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-11076708_latest.zip -d ~/android-sdk/cmdline-tools
mv ~/android-sdk/cmdline-tools/cmdline-tools ~/android-sdk/cmdline-tools/latest

echo 'export ANDROID_HOME=$HOME/android-sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools' >> ~/.bashrc
source ~/.bashrc

sdkmanager --licenses
sdkmanager "platforms;android-35" "build-tools;35.0.0"
```

WSL2 memory config — create `C:\Users\<user>\.wslconfig`:
```ini
[wsl2]
memory=10GB
processors=4
swap=4GB
```

---

## How It Works

1. Electron server starts and displays a QR code with its local IP
2. User scans the QR code with the Android app
3. App connects via WebSocket over local Wi-Fi
4. Touch input on the D-pad or action buttons sends a JSON message:
   - `{ type: "move", direction: "up" }` → W key
   - `{ type: "action", action: "action_runa" }` → F key
5. Electron forwards the command to `keyboard-mapper.exe` via stdin
6. keyboard-mapper uses the Interception driver to inject keystrokes at kernel level

### Why Interception?

Some game clients install keyboard hooks that block synthetic input via standard Windows APIs (`SendInput`, `keybd_event`). Interception bypasses this by injecting input at the driver level, below any software hooks.

---

## Key Mappings

### Directions (D-pad)
| Direction  | Key |
|------------|-----|
| up         | W   |
| down       | S   |
| left       | A   |
| right      | D   |
| up-left    | Q   |
| up-right   | E   |
| down-left  | Z   |
| down-right | C   |

### Action Buttons
| Button | Key      | Description     |
|--------|----------|-----------------|
| F      | F        | Rune attack     |
| P      | F6       | Anti-paralyse   |
| AT     | Ctrl+F9  | Auto target     |
| AS     | Ctrl+F10 | Auto shooting   |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile app | React Native (Expo) |
| Desktop server | Electron |
| Input injection | Python + Interception driver |
| Communication | WebSocket (ws://) |
| Build system | EAS Build / EAS Update |

---

## Known Issues

- `usesCleartextTraffic: true` is required in `app.json` for Android 9+ to allow unencrypted WebSocket connections over local Wi-Fi
- Interception driver must be installed before running `keyboard-mapper.exe`
- Local EAS builds require WSL2 (not WSL1)
- The Interception driver requires a reboot after installation

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.