import sys
import keyboard

# ================= STATE =================

ALL_KEYS = ["w", "a", "s", "d", "q", "e", "z", "c"]

current_state = {key: False for key in ALL_KEYS}

direction_map = {
    "up":         {"w": True},
    "down":       {"s": True},
    "left":       {"a": True},
    "right":      {"d": True},

    # 🔥 diagonais agora são teclas únicas
    "up-left":    {"q": True},
    "up-right":   {"e": True},
    "down-left":  {"z": True},
    "down-right": {"c": True},

    "stop":       {}
}

# ================= APPLY =================

def apply_keys(target):
    global current_state

    # Garante que todas as teclas existam no target
    full_target = {key: False for key in ALL_KEYS}
    full_target.update(target)

    for key in ALL_KEYS:
        if full_target[key] != current_state[key]:
            if full_target[key]:
                keyboard.press(key)
            else:
                keyboard.release(key)

            current_state[key] = full_target[key]

# ================= MAIN LOOP =================

def main():
    print("READY", flush=True)

    while True:
        line = sys.stdin.readline()

        if not line:
            break

        line = line.strip()

        if line == "exit":
            break

        if line in direction_map:
            apply_keys(direction_map[line])
            print(f"OK:{line}", flush=True)

    # soltar tudo ao sair
    apply_keys(direction_map["stop"])

if __name__ == "__main__":
    main()