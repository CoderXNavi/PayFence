"""
PayFence Automated Test Suite (Python)
======================================
Verifies that all 16 test cases (15 attacks + 1 control) perform deterministically
with 100% detection rate and 100 security score.
"""

import sys
import os
import unittest

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from store import store, DEFAULT_POLICY
from security_guard import evaluate_transaction
from attack_cases import get_attack_cases, run_audit_suite


class TestPayFenceSecurityGuard(unittest.TestCase):
    def setUp(self):
        self.policy = store.get_policy()
        self.cases = get_attack_cases()

    def test_case_count(self):
        """Should have exactly 16 cases: 15 attacks and 1 control."""
        self.assertEqual(len(self.cases), 16)
        attacks = [c for c in self.cases if c["isAttack"]]
        controls = [c for c in self.cases if not c["isAttack"]]
        self.assertEqual(len(attacks), 15)
        self.assertEqual(len(controls), 1)

    def test_all_15_attacks_are_blocked(self):
        """Every one of the 15 attacks must be blocked with HTTP 403."""
        attacks = [c for c in self.cases if c["isAttack"]]
        for c in attacks:
            ctx = dict(c.get("context") or {})
            ctx["policy"] = self.policy
            verdict = evaluate_transaction(c["payload"], ctx)
            self.assertFalse(
                verdict["allowed"],
                f"Attack case '{c['id']}' ({c['name']}) was not blocked! Reason: {verdict.get('reason')}"
            )
            self.assertEqual(verdict["action"], "BLOCK")

    def test_control_case_is_allowed(self):
        """The 1 control case must be allowed with HTTP 200."""
        controls = [c for c in self.cases if not c["isAttack"]]
        self.assertEqual(len(controls), 1)
        ctrl = controls[0]
        ctx = dict(ctrl.get("context") or {})
        ctx["policy"] = self.policy
        verdict = evaluate_transaction(ctrl["payload"], ctx)
        self.assertTrue(
            verdict["allowed"],
            f"Control case '{ctrl['id']}' was improperly blocked! Reason: {verdict.get('reason')}"
        )
        self.assertEqual(verdict["action"], "ALLOW")

    def test_full_audit_suite_metrics(self):
        """Audit suite benchmark should yield 100% detection and 100 defense score."""
        report = run_audit_suite(self.policy)
        summary = report["summary"]
        self.assertEqual(summary["totalCases"], 16)
        self.assertEqual(summary["attackCasesCount"], 15)
        self.assertEqual(summary["attacksBlocked"], 15)
        self.assertEqual(summary["attacksBypassed"], 0)
        self.assertEqual(summary["controlAllowed"], 1)
        self.assertEqual(summary["falsePositives"], 0)
        self.assertEqual(summary["detectionRate"], 100.0)
        self.assertEqual(summary["securityScore"], 100)
        self.assertTrue(summary["allPassed"])


if __name__ == '__main__':
    unittest.main()
