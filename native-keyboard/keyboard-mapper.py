import sys
import interception

# ================= DIRECTION STATE =================

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

# ================= ACTION MAP =================
# Cada ação é uma lista de (key, ctrl)
# tap: pressiona e solta imediatamente

action_map = {
    "action_runa":          [("f", False)],
    "action_antiparalyse":  [("f6", False)],
    "action_autotarget":    [("f9", True)],
    "action_autoshooting":  [("f10", True)],
}

# ================= APPLY DIRECTION =================

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

# ================= APPLY ACTION =================

def apply_action(action_name):
    if action_name not in action_map:
        return

    combos = action_map[action_name]
    for key, use_ctrl in combos:
        if use_ctrl:
            interception.key_down("ctrl")
        interception.key_down(key)
        interception.key_up(key)
        if use_ctrl:
            interception.key_up("ctrl")

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

        elif line in action_map:
            apply_action(line)
            print(f"OK:{line}", flush=True)

    apply_keys(direction_map["stop"])

if __name__ == "__main__":
    main()