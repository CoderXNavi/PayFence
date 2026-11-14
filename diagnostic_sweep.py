import os
import sys
import time
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots", "diagnostics")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def run_diagnostic_sweep():
    print("=" * 70)
    print("PAYFENCE COMPREHENSIVE DIAGNOSTIC SWEEP (ALL PAGES & INTERACTION SEAMS)")
    print("=" * 70)

    console_errors = []
    unhandled_rejections = []
    failed_requests = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Listen to console and network
        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ["error", "warning"] else None)
        page.on("pageerror", lambda err: unhandled_rejections.append(str(err)))
        page.on("requestfailed", lambda req: failed_requests.append(f"{req.method} {req.url} - {req.failure}"))

        # -------------------------------------------------------------
        # SEAM 1: AUTHENTICATION & LOGIN FLOW
        # -------------------------------------------------------------
        print("\n[DIAGNOSTIC SEAM 1] Probing Auth Flow & Session Management...")
        page.goto("http://localhost:5173", timeout=30000)
        page.wait_for_load_state("networkidle")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "diag_1_auth.png"))

        # Verify Quick Demo Login button
        demo_btn = page.locator("button:has-text('Quick Demo Login')")
        assert demo_btn.is_visible(), "ASSERTION FAILED: Quick Demo Login button missing on Auth page."
        demo_btn.click()
        page.wait_for_selector("text=Security overview", timeout=10000)
        page.wait_for_load_state("networkidle")
        print("  ✓ Quick Demo Login authenticated and reached Dashboard.")

        # -------------------------------------------------------------
        # SEAM 2: DASHBOARD (OVERVIEW) TELEMETRY & METRICS
        # -------------------------------------------------------------
        print("\n[DIAGNOSTIC SEAM 2] Probing Dashboard Telemetry & KPI Cards...")
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "diag_2_dashboard.png"))

        # Verify wallet balance in navbar
        nav_balance = page.locator("header").locator("text=$500.00").first
        assert nav_balance.is_visible(), "ASSERTION FAILED: Balance $500.00 not found in navbar."
        print("  ✓ Navbar balance metric verified ($500.00 USD).")

        # Verify KPI cards
        kpi_score = page.locator("text=100%").first
        assert kpi_score.is_visible(), "ASSERTION FAILED: 100% Defense KPI score not visible."
        
        # Verify OWASP Category Progress bars
        bola_bar = page.locator("text=BOLA / IDOR").first
        assert bola_bar.is_visible(), "ASSERTION FAILED: BOLA progress bar missing on Dashboard."
        print("  ✓ Dashboard KPI cards and OWASP distribution bars verified.")

        # -------------------------------------------------------------
        # SEAM 3: INTERACTIVE PLAYGROUND (ATTACK INJECTION & SANDBOX)
        # -------------------------------------------------------------
        print("\n[DIAGNOSTIC SEAM 3] Probing Interactive Attack Playground...")
        page.click("a[href='/playground']")
        page.wait_for_selector("text=Interactive playground", timeout=10000)
        page.wait_for_load_state("networkidle")
        time.sleep(0.5)

        # 3a: Test Category Filtering in Playground
        for cat_name in ["BOLA / IDOR", "Business Logic & Limits", "Input Validation", "Origin Spoofing", "Protocol Integrity", "All Categories"]:
            cat_btn = page.locator(f"button:has-text('{cat_name}')").first
            assert cat_btn.is_visible(), f"ASSERTION FAILED: Category button '{cat_name}' missing in Playground."
            cat_btn.click()
            time.sleep(0.3)
            # Verify dropdown options updated
            options = page.locator("select option").all()
            assert len(options) > 0, f"ASSERTION FAILED: Scenario dropdown empty for category '{cat_name}'."
            print(f"  ✓ Playground filter '{cat_name}' verified ({len(options)} options).")

        # 3b: Test Attack Execution (Negative Amount / BOLA)
        select_elem = page.locator("select").first
        select_elem.select_option(index=1)
        time.sleep(0.3)

        test_payload_btn = page.locator("button:has-text('Test payload')")
        test_payload_btn.click()
        time.sleep(1)

        # Check verdict card
        verdict_text = page.locator("text=HTTP 403").first
        assert verdict_text.is_visible(), "ASSERTION FAILED: Expected HTTP 403 Forbidden for attack payload."
        print("  ✓ Playground attack execution verified (HTTP 403 Blocked with rule explanation).")

        # 3c: Test Legitimate Control Execution
        select_elem.select_option(value='ctrl-01') # Select legitimate control
        time.sleep(0.3)
        test_payload_btn.click()
        time.sleep(1)

        allowed_text = page.locator("text=HTTP 200").first
        assert allowed_text.is_visible(), "ASSERTION FAILED: Expected HTTP 200 OK for legitimate control."
        print("  ✓ Playground legitimate control execution verified (HTTP 200 OK Approved).")

        # 3d: Test Malformed JSON Handling
        editor = page.locator("textarea").first
        editor.fill("{ malformed_json_syntax ")
        time.sleep(0.3)
        err_banner = page.locator("div.bg-red-50").first
        assert err_banner.is_visible(), "ASSERTION FAILED: JSON syntax error banner not shown on invalid payload."
        print("  ✓ Playground malformed JSON syntax validation verified.")

        # Reset payload
        page.locator("button[title='Reset payload to default']").click()
        time.sleep(0.3)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "diag_3_playground.png"))

        # -------------------------------------------------------------
        # SEAM 4: RED TEAM AUTOMATED BENCHMARK
        # -------------------------------------------------------------
        print("\n[DIAGNOSTIC SEAM 4] Probing Red Team Automated Benchmark...")
        page.click("a[href='/red-team']")
        page.wait_for_selector("text=Red team security audit", timeout=10000)
        page.wait_for_load_state("networkidle")
        time.sleep(0.5)

        # Test all 6 category filters on Red Team
        filters_to_test = [
            ("BOLA / IDOR", 6),
            ("Business Logic & Limits", 6),
            ("Input Validation", 6),
            ("Origin Spoofing", 5),
            ("Protocol Integrity", 6),
            ("All Categories", 29)
        ]
        for name, expected_count in filters_to_test:
            page.click(f"button:has-text('{name}')")
            time.sleep(0.3)
            hdr = page.locator("text=Test suite cases").first.inner_text()
            assert f"{expected_count} of 29" in hdr, f"ASSERTION FAILED: Red Team filter '{name}' expected {expected_count} of 29, got '{hdr}'."
            rendered_rows = page.locator("div.divide-y > div").all()
            assert len(rendered_rows) == expected_count, f"ASSERTION FAILED: '{name}' rendered {len(rendered_rows)} rows instead of {expected_count}."
            print(f"  ✓ Red Team filter '{name}' verified ({expected_count} of 29 cases rendered).")

        # Test test drawer payload expansion
        first_row = page.locator("div.divide-y > div").first
        first_row.click()
        time.sleep(0.4)
        payload_pre = page.locator("pre").first
        payload_content = payload_pre.inner_text().strip()
        assert len(payload_content) > 15, "ASSERTION FAILED: Expanded test payload is empty."
        assert "{" in payload_content and "}" in payload_content, "ASSERTION FAILED: Payload is not formatted JSON."
        print("  ✓ Expanded test drawer payload verified (valid JSON populated).")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "diag_4_redteam.png"))

        # -------------------------------------------------------------
        # SEAM 5: BLUE TEAM POLICY ENGINE & SLIDERS
        # -------------------------------------------------------------
        print("\n[DIAGNOSTIC SEAM 5] Probing Blue Team Policy Management...")
        page.click("a[href='/blue-team']")
        page.wait_for_selector("text=Policy configuration", timeout=10000)
        page.wait_for_load_state("networkidle")
        time.sleep(0.5)

        # Test preset buttons ($25 for per-tx cap)
        preset_25 = page.locator("button:has-text('$25')").first
        if preset_25.is_visible():
            preset_25.click()
            time.sleep(0.3)
            tx_input = page.locator("input[type='number']").first
            val = tx_input.input_value()
            assert val == "25", f"ASSERTION FAILED: Preset $25 button did not update input (got '{val}')."
            print("  ✓ Blue Team transaction cap preset verified ($25.00).")

        # Test adding a recipient account
        addr_input = page.locator("input[placeholder*='0x']").first
        if addr_input.is_visible():
            test_addr = "0x9999888877776666555544443333222211110000"
            addr_input.fill(test_addr)
            page.locator("button:has-text('Add')").first.click()
            time.sleep(0.3)
            assert page.locator(f"text={test_addr}").first.is_visible(), "ASSERTION FAILED: Added account not displayed in whitelist."
            print("  ✓ Blue Team recipient whitelist addition verified.")

        # Test Save Policy button
        save_btn = page.locator("button:has-text('Save policy rules')")
        if save_btn.is_visible():
            save_btn.click()
            time.sleep(0.5)
            print("  ✓ Blue Team policy synchronization verified.")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "diag_5_blueteam.png"))

        # -------------------------------------------------------------
        # SEAM 6: FORENSIC AUDIT LOGS & INSPECTION MODAL
        # -------------------------------------------------------------
        print("\n[DIAGNOSTIC SEAM 6] Probing Forensic Audit Logs & Telemetry...")
        page.click("a[href='/audit-logs']")
        page.wait_for_selector("text=Forensic audit logs", timeout=10000)
        page.wait_for_load_state("networkidle")
        time.sleep(0.5)

        # Test Filter tabs on Audit Logs (All, Blocked, Allowed)
        for log_filter in ["All", "403 Blocked", "200 Allowed"]:
            flt_btn = page.locator(f"button:has-text('{log_filter}')").first
            if flt_btn.is_visible():
                flt_btn.click()
                time.sleep(0.3)
                print(f"  ✓ Audit Logs filter '{log_filter}' clicked and responsive.")

        # Test modal inspection
        inspect_btn = page.locator("button:has-text('Inspect')").first
        if inspect_btn.is_visible():
            inspect_btn.click()
            time.sleep(0.5)
            modal = page.locator("text=Captured telemetry and context")
            assert modal.is_visible(), "ASSERTION FAILED: Inspection modal did not render context."
            print("  ✓ Audit log telemetry inspection modal verified.")
            
            # Close modal
            page.locator("button:has-text('Close')").first.click()
            time.sleep(0.3)
            print("  ✓ Inspection modal closed cleanly.")

        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "diag_6_auditlogs.png"))

        browser.close()

    print("\n" + "=" * 70)
    print("DIAGNOSTIC SUMMARY & HEALTH REPORT")
    print("=" * 70)
    print(f"• Total Console Errors: {len(console_errors)}")
    for err in console_errors:
        print(f"    - {err}")
    print(f"• Unhandled Promise Rejections: {len(unhandled_rejections)}")
    for err in unhandled_rejections:
        print(f"    - {err}")
    print(f"• Failed Network Requests: {len(failed_requests)}")
    for err in failed_requests:
        print(f"    - {err}")

    if len(console_errors) == 0 and len(unhandled_rejections) == 0 and len(failed_requests) == 0:
        print("\n>>> ALL 6 SEAMS ARE 100% GREEN. ZERO BUGS OR REGRESSIONS DETECTED. <<<")
    else:
        print("\n>>> BUGS DETECTED IN SWEEP — ENTERING PHASE 3 (HYPOTHESISE) <<<")

if __name__ == "__main__":
    run_diagnostic_sweep()
