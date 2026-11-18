"""Drive the running app in headless Chrome: login -> tabs -> Kisaan AI question.
Usage: .claude/skills/run-ameer-kisaan/.venv/bin/python .claude/skills/run-ameer-kisaan/driver.py [tab ...]
Screenshots land in .claude/skills/run-ameer-kisaan/out/*.png. Exit 1 on unexpected console errors.
Tabs: Weather, Crops, Recommendations, Issues, "Kisaan AI", Schemes, Inventory, "Community Forum".
"""
import os, re, sys
from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out"); os.makedirs(OUT, exist_ok=True)
tabs = sys.argv[1:] or ["Kisaan AI", "Inventory"]
# Expected noise: refresh 401 before login; CRA dev server has no service-worker.js.
BENIGN = re.compile(r"status of (401|404)")

with sync_playwright() as p:
    try:
        b = p.chromium.launch(channel="chrome", headless=True)   # installed Google Chrome
    except Exception:
        b = p.chromium.launch(headless=True)                      # needs `playwright install chromium`
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    errs = []; pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    pg.goto("http://localhost:3000"); pg.wait_for_selector("input[name=email]")
    pg.screenshot(path=f"{OUT}/0-login.png")
    pg.locator("input[name=email]").fill("farmer@example.com")
    pg.locator("input[name=password]").fill("Str0ng-Passw0rd!x")
    pg.get_by_role("button", name="Login").click()
    pg.get_by_role("tab", name="Weather").wait_for(timeout=15000)
    pg.wait_for_timeout(2000); pg.screenshot(path=f"{OUT}/1-home.png"); print("logged in")
    for i, t in enumerate(tabs, 2):
        pg.get_by_role("tab", name=t).click(); pg.wait_for_timeout(1500)
        if t == "Kisaan AI":
            box = pg.get_by_placeholder("Ask about your crops...")
            box.fill("How should I water wheat?"); box.press("Enter")
            pg.get_by_text("[1]").first.wait_for(timeout=15000); print("assistant answered with sources")
        shot = f"{OUT}/{i}-{t.lower().replace(' ', '-')}.png"; pg.screenshot(path=shot); print("screenshot", shot)
    b.close()
bad = [e for e in errs if not BENIGN.search(e)]
print("unexpected console errors:", bad)
sys.exit(1 if bad else 0)
