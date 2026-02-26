import sys
import interception

ALL_KEYS = ["w", "a", "s", "d", "q", "e", "z", "c"]

current_state = {key: False for key in ALL_KEYS}

direction_map = {
    "up":         {"w": True},
    "down":       {"s": True},
    "left":       {"a": True},
    "right":      {"d": True},
    "up-left":    {"q": True},
    "up-right":   {"e": True},
    "down-left":  {"z": True},
    "down-right": {"c": True},
    "stop":       {}
}

def apply_keys(target):
    global current_state
    full_target = {key: False for key in ALL_KEYS}
    full_target.update(target)

    for key in ALL_KEYS:
        if full_target[key] != current_state[key]:
            if full_target[key]:
                interception.key_down(key)
            else:
                interception.key_up(key)
            current_state[key] = full_target[key]

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

    apply_keys(direction_map["stop"])

if __name__ == "__main__":
    main()