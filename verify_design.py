import os
import sys
import time
import json
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def verify_ui():
    results = {
        "header_height": None,
        "header_clutter_removed": False,
        "sidebar_items": [],
        "sidebar_items_equal": False,
        "academic_capstone_removed": False,
        "horizontal_overflow": False,
        "terminal_prefix_removed": False,
        "all_checks_passed": False
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("[1/5] Navigating to http://localhost:5173...")
        page.goto("http://localhost:5173", timeout=30000)
        page.wait_for_load_state("networkidle")

        # Check if auth page is showing
        quick_login = page.locator("button:has-text('Quick Demo Login')")
        if quick_login.is_visible():
            print("  Logging in via Quick Demo Login...")
            quick_login.click()
            page.wait_for_selector("nav", timeout=10000)
            page.wait_for_load_state("networkidle")

        time.sleep(1)

        # 1. Header Verification
        header = page.locator("header").first
        if header.is_visible():
            box = header.bounding_box()
            results["header_height"] = box["height"] if box else 0
            header_text = header.inner_text()
            has_latency = "latency" in header_text.lower() or "6.4" in header_text
            has_strict_active = "gateway: strict" in header_text.lower()
            results["header_clutter_removed"] = (not has_latency) and (not has_strict_active)
            print(f"  Header bounding box height: {box['height'] if box else 'N/A'}px")
            print(f"  Header clutter removed: {results['header_clutter_removed']}")
            header.screenshot(path=os.path.join(SCREENSHOT_DIR, "v2_header_slim.png"))

        # 2. Sidebar Verification
        sidebar = page.locator("aside").first
        if sidebar.is_visible():
            sidebar_text = sidebar.inner_text()
            results["academic_capstone_removed"] = "academic capstone" not in sidebar_text.lower()
            print(f"  Academic capstone removed: {results['academic_capstone_removed']}")
            
            nav_links = sidebar.locator("nav a").all()
            dims = []
            for idx, link in enumerate(nav_links):
                l_box = link.bounding_box()
                text = link.inner_text().strip().replace("\n", " ")
                dims.append({"text": text, "height": l_box["height"], "width": l_box["width"]})
            results["sidebar_items"] = dims
            
            # Check if all links have identical height
            heights = [d["height"] for d in dims]
            results["sidebar_items_equal"] = len(set(heights)) <= 1 if heights else False
            print(f"  Sidebar link heights: {heights} (Equal: {results['sidebar_items_equal']})")
            
            sidebar.screenshot(path=os.path.join(SCREENSHOT_DIR, "v2_sidebar_modular.png"))

        # 3. Horizontal Overflow check
        overflow = page.evaluate("""() => {
            return {
                docScrollWidth: document.documentElement.scrollWidth,
                docClientWidth: document.documentElement.clientWidth,
                bodyScrollWidth: document.body.scrollWidth,
                bodyClientWidth: document.body.clientWidth,
                hasOverflow: document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth
            }
        }""")
        results["horizontal_overflow"] = overflow["hasOverflow"]
        print(f"  Horizontal overflow check: {overflow}")

        # 4. Dashboard Full Page screenshot
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "v2_dashboard_clean.png"))

        # 5. Playground Verification
        page.click("a[href='/playground']")
        page.wait_for_selector("select", timeout=10000)
        time.sleep(0.5)

        pg_header = page.locator("h1, h2").first.inner_text()
        results["terminal_prefix_removed"] = not pg_header.startswith(">_")
        print(f"  Playground header: '{pg_header}', terminal prefix removed: {results['terminal_prefix_removed']}")

        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "v2_playground_clean.png"))

        # Overall pass check
        results["all_checks_passed"] = (
            results["header_height"] is not None and
            results["header_height"] <= 60 and
            results["header_clutter_removed"] and
            results["academic_capstone_removed"] and
            results["sidebar_items_equal"] and
            not results["horizontal_overflow"]
        )

        browser.close()

    print("\nVerification Summary:")
    print(json.dumps(results, indent=2))
    return results

if __name__ == "__main__":
    verify_ui()
