import importlib.util
import json
from pathlib import Path
import socket
import threading
import types
import unittest

spec = importlib.util.spec_from_file_location("drey_approval", Path(__file__).parents[2] / "runtime/jax_approval.py")
adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(adapter)


class ExistingCLI:
    def _approval_callback(self, command, description, **kwargs):
        return "old_frontend"

    def _computer_use_approval_callback(self, action, args, summary):
        return "old_frontend"


class ApprovalTests(unittest.TestCase):
    def invoke(self, computer=False, decision="allow_once", wrong_id=False, disconnect=False):
        left, right = socket.socketpair()
        left.settimeout(1)
        module = types.SimpleNamespace(HermesCLI=ExistingCLI)
        requests = []
        close = adapter.install_frontend(module, left)

        def respond():
            request = json.loads(right.makefile("rb").readline())
            requests.append(request)
            if disconnect:
                right.shutdown(socket.SHUT_RDWR)
                return
            right.sendall((json.dumps({"id": "wrong" if wrong_id else request["id"], "decision": decision}) + "\n").encode())

        responder = threading.Thread(target=respond)
        responder.start()
        try:
            client = module.HermesCLI()
            if computer:
                result = client._computer_use_approval_callback("focus_app", {"app": "Calculator", "raise_window": True}, "Open Calculator")
            else:
                result = client._approval_callback("some command", "Review command", allow_permanent=True)
            responder.join(timeout=2)
            return result, requests
        finally:
            close()
            left.close()
            right.close()

    def test_one_approval_does_not_enable_session_or_always_mode(self):
        result, _ = self.invoke()
        self.assertEqual(result, "once")
        result, requests = self.invoke(computer=True)
        self.assertEqual(result, "approve_once")
        self.assertEqual(json.loads(requests[0]["details"]), {"app": "Calculator", "raise_window": True})

    def test_wrong_nonce_unknown_choice_and_disconnection_deny(self):
        for kwargs in [{"wrong_id": True}, {"decision": "always_approve"}, {"decision": "approve_session"}, {"disconnect": True}]:
            result, _ = self.invoke(**kwargs)
            self.assertEqual(result, "deny")

    def test_incompatible_installed_cli_stops_before_replacing_callbacks(self):
        module = types.SimpleNamespace(HermesCLI=object)
        left, right = socket.socketpair()
        try:
            with self.assertRaisesRegex(RuntimeError, "incompatible"):
                adapter.install_frontend(module, left)
            self.assertIs(module.HermesCLI, object)
        finally:
            left.close()
            right.close()
