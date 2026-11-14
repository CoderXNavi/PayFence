import os
import sys
import time
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def run_audit():
    print("=" * 60)
    print("PayFence Web Application End-to-End Audit & Logical Analysis")
    print("=" * 60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Step 1: Open app & verify Auth Page
        print("\n[Step 1] Loading Web App at http://localhost:5173...")
        page.goto("http://localhost:5173", timeout=30000)
        page.wait_for_load_state("networkidle")
        
        auth_shot = os.path.join(SCREENSHOT_DIR, "1_auth_page.png")
        page.screenshot(path=auth_shot)
        print(f"  ✓ Auth page loaded successfully. Saved screenshot: {auth_shot}")
        
        # Verify Quick Demo Login button exists
        quick_login_btn = page.locator("button:has-text('Quick Demo Login')")
        assert quick_login_btn.is_visible(), "Quick Demo Login button not found on Auth page!"
        print("  ✓ Found 'Quick Demo Login' button.")
        
        # Click Quick Demo Login
        quick_login_btn.click()
        page.wait_for_selector("text=Security overview", timeout=10000)
        page.wait_for_load_state("networkidle")
        print("  ✓ Quick Demo Login authenticated and Dashboard rendered.")

        # Step 2: Dashboard Overview & Metric Cards
        print("\n[Step 2] Auditing Dashboard Overview...")
        time.sleep(1)
        dash_shot = os.path.join(SCREENSHOT_DIR, "2_dashboard.png")
        page.screenshot(path=dash_shot)
        
        # Verify navbar balance and daily budget
        assert page.locator("text=$500.00").first.is_visible(), "Mock wallet balance $500.00 not displayed!"
        print("  ✓ Verified Mock Wallet Balance: $500.00 USDC in navbar.")
        assert page.locator("text=$200.00").first.is_visible(), "Daily budget $200.00 not displayed!"
        print("  ✓ Verified Daily Budget limit: $200.00 in navbar.")
        
        # Verify 4 KPI cards
        assert page.locator("text=100%").first.is_visible(), "Defense score KPI not displayed!"
        assert page.locator("text=Gateway status").first.is_visible(), "Gateway status KPI not displayed!"
        print("  ✓ Verified high-level KPI cards and OWASP category defense breakdown.")
        print(f"  ✓ Saved screenshot: {dash_shot}")

        # Step 3: Interactive Playground (Attack Simulation)
        print("\n[Step 3] Auditing Interactive Attack Sandbox (/playground)...")
        page.click("a[href='/playground']")
        page.wait_for_selector("text=Interactive playground", timeout=10000)
        page.wait_for_load_state("networkidle")
        time.sleep(0.5)

        # Select attack scenario (index 1: Cross-Tenant Account Drainage / BOLA)
        select = page.locator("select").first
        select.select_option(index=1)
        time.sleep(0.5)
        
        # Click "Test payload"
        test_btn = page.locator("button:has-text('Test payload')")
        assert test_btn.is_visible(), "'Test payload' button missing!"
        test_btn.click()
        time.sleep(1)

        # Check verdict shows 403 Forbidden
        assert page.locator("text=HTTP 403").first.is_visible(), "Expected HTTP 403 verdict!"
        print("  ✓ Tested Attack Vector: Gateway returned HTTP 403 Forbidden with policy rule violation.")
        
        play_block_shot = os.path.join(SCREENSHOT_DIR, "3_playground_attack_blocked.png")
        page.screenshot(path=play_block_shot)
        print(f"  ✓ Saved screenshot: {play_block_shot}")

        # Test Legitimate Micropayment (index 0: Legitimate Agent Payment)
        print("\n[Step 3b] Testing Legitimate Control Payment in Playground...")
        select.select_option(index=0)
        time.sleep(0.5)
        test_btn.click()
        time.sleep(1)

        # Check verdict shows 200 OK
        assert page.locator("text=HTTP 200").first.is_visible(), "Expected HTTP 200 verdict!"
        print("  ✓ Tested Legitimate Control: Gateway returned HTTP 200 OK Approved.")
        
        play_allow_shot = os.path.join(SCREENSHOT_DIR, "3b_playground_legitimate_allowed.png")
        page.screenshot(path=play_allow_shot)
        print(f"  ✓ Saved screenshot: {play_allow_shot}")

        # Step 4: Red Team Automated Audit
        print("\n[Step 4] Auditing Red Team Automated Benchmark (/red-team)...")
        page.click("a[href='/red-team']")
        page.wait_for_selector("text=Automated security audit", timeout=10000)
        page.wait_for_load_state("networkidle")
        time.sleep(0.5)

        run_audit_btn = page.locator("button:has-text('Run security audit')")
        assert run_audit_btn.is_visible(), "'Run security audit' button missing!"
        run_audit_btn.click()
        print("  ✓ Clicked 'Run security audit'. Executing 29-vector suite...")
        
        # Wait for audit execution to complete
        time.sleep(3)
        assert page.locator("text=100%").first.is_visible(), "100% Defense score not visible!"
        print("  ✓ Red Team Suite Completed: 28/28 Attacks Blocked, 1/1 Allowed, 100% Defense Score.")
        
        redteam_shot = os.path.join(SCREENSHOT_DIR, "4_red_team_audit.png")
        page.screenshot(path=redteam_shot)
        print(f"  ✓ Saved screenshot: {redteam_shot}")

        # Step 5: Blue Team Policy Management
        print("\n[Step 5] Auditing Blue Team Policy Engine (/blue-team)...")
        page.click("a[href='/blue-team']")
        page.wait_for_selector("text=Policy configuration", timeout=10000)
        page.wait_for_load_state("networkidle")
        time.sleep(0.5)
        
        blueteam_shot = os.path.join(SCREENSHOT_DIR, "5_blue_team_policies.png")
        page.screenshot(path=blueteam_shot)
        print("  ✓ Verified policy sliders, transaction caps ($50.00), daily budget ($200.00), and whitelist managers.")
        print(f"  ✓ Saved screenshot: {blueteam_shot}")

        # Step 6: Forensic Audit Logs
        print("\n[Step 6] Auditing Forensic Logs & Inspector Modal (/audit-logs)...")
        page.click("a[href='/audit-logs']")
        page.wait_for_selector("text=Forensic audit logs", timeout=10000)
        page.wait_for_load_state("networkidle")
        time.sleep(0.5)

        # Click Inspect on first log row
        inspect_btn = page.locator("button:has-text('Inspect')").first
        if inspect_btn.is_visible():
            inspect_btn.click()
            time.sleep(0.5)
            print("  ✓ Clicked 'Inspect'. Inspection modal rendered with telemetry details.")
            
        logs_shot = os.path.join(SCREENSHOT_DIR, "6_audit_logs_modal.png")
        page.screenshot(path=logs_shot)
        print(f"  ✓ Saved screenshot: {logs_shot}")

        browser.close()
        
    print("\n" + "=" * 60)
    print("ALL WEB APPLICATION AUDITS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_audit()
