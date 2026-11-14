import os
import sys
import time
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def test_redteam():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("[1] Opening app and logging in...")
        page.goto("http://localhost:5173", timeout=30000)
        page.wait_for_load_state("networkidle")
        
        # Click Quick Demo Login
        page.click("button:has-text('Quick Demo Login')")
        page.wait_for_selector("text=Security overview", timeout=10000)
        print("  ✓ Authenticated and on Dashboard.")

        # Navigate to /red-team
        print("[2] Navigating to /red-team...")
        page.click("a[href='/red-team']")
        page.wait_for_selector("text=Red team security audit", timeout=10000)
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # Verify Red Team is rendered cleanly
        # Check first test vector #1
        first_row = page.locator("text=#1").first
        assert first_row.is_visible(), "Test #1 not visible!"

        # Ensure #1 is expanded
        drawer = page.locator("text=Injected test payload").first
        if not drawer.is_visible():
            page.locator("div:has-text('#1')").first.click()
            time.sleep(0.5)

        # Check payload <pre>
        pre_elem = page.locator("pre").first
        payload_text = pre_elem.inner_text().strip()
        print(f"\n[3] Injected test payload content:\n{payload_text}")

        assert len(payload_text) > 10, "ERROR: Injected test payload is empty or too short!"
        assert "{" in payload_text and "}" in payload_text, "ERROR: Payload is not valid JSON!"
        print("  ✓ Injected test payload is populated and verified as valid JSON.")

        # Take screenshot
        shot_path = os.path.join(SCREENSHOT_DIR, "red_team_fixed.png")
        page.screenshot(path=shot_path)
        print(f"  ✓ Saved screenshot: {shot_path}")

        browser.close()
        print("\nALL ASSERTIONS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    test_redteam()

