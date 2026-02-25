import sys
import keyboard

# ================= STATE =================

current_state = {
    "w": False,
    "a": False,
    "s": False,
    "d": False
}

direction_map = {
    "up":         {"w": True,  "a": False, "s": False, "d": False},
    "down":       {"w": False, "a": False, "s": True,  "d": False},
    "left":       {"w": False, "a": True,  "s": False, "d": False},
    "right":      {"w": False, "a": False, "s": False, "d": True},
    "up-left":    {"w": True,  "a": True,  "s": False, "d": False},
    "up-right":   {"w": True,  "a": False, "s": False, "d": True},
    "down-left":  {"w": False, "a": True,  "s": True,  "d": False},
    "down-right": {"w": False, "a": False, "s": True,  "d": True},
    "stop":       {"w": False, "a": False, "s": False, "d": False}
}

# ================= APPLY =================

def apply_keys(target):
    global current_state

    for key in ["w", "a", "s", "d"]:
        if target[key] != current_state[key]:
            if target[key]:
                keyboard.press(key)
            else:
                keyboard.release(key)

            current_state[key] = target[key]

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