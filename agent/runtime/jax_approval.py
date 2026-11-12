"""Attach a local approval frontend to the existing Hermes CLI, in this child only.

The official entry point still owns profile/model/session setup. No installed Hermes
file, account setting or approval mode is changed. Missing/incompatible callbacks
stop the adapter; missing frontend answers deny the action.
"""

import argparse
import inspect
import json
import os
from pathlib import Path
import socket
import sys
import threading
import uuid


def install_frontend(cli_module, channel):
    original = cli_module.HermesCLI
    required = {
        "_approval_callback": {"command", "description"},
        "_computer_use_approval_callback": {"action", "args", "summary"},
    }
    for name, parameters in required.items():
        callback = getattr(original, name, None)
        if not callable(callback) or not parameters.issubset(inspect.signature(callback).parameters):
            raise RuntimeError("The installed Jax approval API is incompatible. No action was approved.")

    lock = threading.Lock()
    reader = channel.makefile("rb")

    def decide(request):
        with lock:
            request["id"] = str(uuid.uuid4())
            data = json.dumps(request, ensure_ascii=True).encode("utf-8")
            if len(data) > 32_768:
                return False
            try:
                channel.sendall(data + b"\n")
                answer = reader.readline(4_097)
                if not answer.endswith(b"\n") or len(answer) > 4_096:
                    return False
                result = json.loads(answer)
                return isinstance(result, dict) and result.get("id") == request["id"] and result.get("decision") == "allow_once"
            except (OSError, ValueError, TypeError):
                return False

    class DreyClickyCLI(original):
        def _approval_callback(self, command, description, **_kwargs):
            allowed = decide({"kind": "command", "summary": description, "details": command})
            return "once" if allowed else "deny"

        def _computer_use_approval_callback(self, action, args, summary):
            allowed = decide({"kind": "computer_use", "action": action, "summary": summary, "details": json.dumps(args, ensure_ascii=False, sort_keys=True)})
            return "approve_once" if allowed else "deny"

    cli_module.HermesCLI = DreyClickyCLI
    return reader.close


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--hermes-root", required=True)
    parser.add_argument("--profile", default="jax")
    parser.add_argument("--check", action="store_true")
    options, forwarded = parser.parse_known_args()
    if forwarded[:1] == ["--"]:
        forwarded = forwarded[1:]
    root = Path(options.hermes_root).resolve(strict=True)
    if not (root / "hermes_cli/main.py").is_file() or not (root / "cli.py").is_file():
        raise RuntimeError("The configured Hermes root is not a CLI installation.")
    if not options.profile or not all(c.isalnum() or c in "_-" for c in options.profile):
        raise RuntimeError("Invalid Jax profile name.")
    sys.path.insert(0, str(root))
    sys.argv = ["hermes", "-p", options.profile, *forwarded]
    # Importing the official entry point applies -p before CLI_CONFIG is loaded.
    from hermes_cli import main as entrypoint
    import cli

    if options.check:
        left, right = socket.socketpair()
        try:
            close = install_frontend(cli, left)
            from hermes_cli.config import get_hermes_home
            print(json.dumps({"compatible": True, "profile": options.profile, "profileHome": str(get_hermes_home())}))
            close()
        finally:
            left.close()
            right.close()
        return

    descriptor = int(os.environ.pop("DREY_CLICKY_APPROVAL_FD", "-1"))
    if descriptor < 3:
        raise RuntimeError("No local approval frontend. No action was approved.")
    os.set_inheritable(descriptor, False)
    with socket.socket(fileno=descriptor) as channel:
        channel.settimeout(70)
        close = install_frontend(cli, channel)
        try:
            entrypoint.main()
        finally:
            close()


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, ValueError) as error:
        print(f"Drey Clicky approval adapter: {error}", file=sys.stderr)
        sys.exit(74)
