import os
import sys
import time
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def test_category_filters():
    print("=" * 60)
    print("Testing Red Team Category Filtering & Payload Render")
    print("=" * 60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("[1] Opening app and logging in...")
        page.goto("http://localhost:5173", timeout=30000)
        page.wait_for_load_state("networkidle")
        
        page.click("button:has-text('Quick Demo Login')")
        page.wait_for_selector("text=Security overview", timeout=10000)
        print("  ✓ Authenticated.")

        print("[2] Navigating to /red-team...")
        page.click("a[href='/red-team']")
        page.wait_for_selector("text=Red team security audit", timeout=10000)
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # 1. Test clicking 'BOLA / IDOR'
        print("\n[3] Testing Category: BOLA / IDOR...")
        page.click("button:has-text('BOLA / IDOR')")
        time.sleep(0.5)

        bola_count_text = page.locator("text=Test suite cases").first.inner_text()
        print(f"  Count header: {bola_count_text}")
        assert "6 of 29" in bola_count_text, f"Expected '6 of 29', got '{bola_count_text}'"

        # Check that rows are visible and not 0
        rows = page.locator("div.divide-y > div").all()
        print(f"  Rows rendered: {len(rows)}")
        assert len(rows) == 6, f"Expected exactly 6 rows for BOLA / IDOR, got {len(rows)}"

        # Expand the first BOLA row
        rows[0].click()
        time.sleep(0.5)

        # Check payload is visible and has content
        pre_elem = page.locator("pre").first
        payload_text = pre_elem.inner_text().strip()
        print(f"  Payload preview:\n{payload_text[:120]}...")
        assert len(payload_text) > 20, "Payload is empty!"
        assert "account_id" in payload_text or "recipient" in payload_text, "Payload missing expected keys!"

        # Screenshot BOLA filter state
        bola_shot = os.path.join(SCREENSHOT_DIR, "bola_category_filtered.png")
        page.screenshot(path=bola_shot)
        print(f"  ✓ Saved screenshot: {bola_shot}")

        # 2. Test Business Logic & Limits
        print("\n[4] Testing Category: Business Logic & Limits...")
        page.click("button:has-text('Business Logic & Limits')")
        time.sleep(0.5)
        logic_count_text = page.locator("text=Test suite cases").first.inner_text()
        print(f"  Count header: {logic_count_text}")
        assert "6 of 29" in logic_count_text

        # 3. Test Input Validation
        print("\n[5] Testing Category: Input Validation...")
        page.click("button:has-text('Input Validation')")
        time.sleep(0.5)
        input_count_text = page.locator("text=Test suite cases").first.inner_text()
        print(f"  Count header: {input_count_text}")
        assert "6 of 29" in input_count_text

        # 4. Test Origin Spoofing
        print("\n[6] Testing Category: Origin Spoofing...")
        page.click("button:has-text('Origin Spoofing')")
        time.sleep(0.5)
        origin_count_text = page.locator("text=Test suite cases").first.inner_text()
        print(f"  Count header: {origin_count_text}")
        assert "5 of 29" in origin_count_text

        # 5. Test Protocol Integrity
        print("\n[7] Testing Category: Protocol Integrity...")
        page.click("button:has-text('Protocol Integrity')")
        time.sleep(0.5)
        proto_count_text = page.locator("text=Test suite cases").first.inner_text()
        print(f"  Count header: {proto_count_text}")
        assert "6 of 29" in proto_count_text

        # 6. Test All Categories
        print("\n[8] Testing Category: All Categories...")
        page.click("button:has-text('All Categories')")
        time.sleep(0.5)
        all_count_text = page.locator("text=Test suite cases").first.inner_text()
        print(f"  Count header: {all_count_text}")
        assert "29 of 29" in all_count_text

        browser.close()
        print("\n" + "=" * 60)
        print("ALL 6 CATEGORY FILTERS & PAYLOAD TESTS PASSED 100%!")
        print("=" * 60)

if __name__ == "__main__":
    test_category_filters()

