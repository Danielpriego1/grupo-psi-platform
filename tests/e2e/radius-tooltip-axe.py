"""
E2E (mobile + axe-core): run accessibility checks against the Sora
proximity-radius circle and its tooltip in three states:

  1. Baseline (tooltip closed)
  2. Tooltip opened via touch (pointerdown, pointerType='touch')
  3. After the 2.5s auto-close

axe-core is injected from a CDN. We scope the analysis to the region
around the circle + any live tooltip to keep the report focused on the
control under test. Serious/critical violations fail the test.
"""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

SS = Path(__file__).parent / "screenshots"
SS.mkdir(parents=True, exist_ok=True)

AXE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.0/axe.min.js"
CIRCLE_SELECTOR = '[role="slider"][aria-label="Radio de proximidad de Sora"]'
TOOLTIP_SELECTOR = '[role="tooltip"]:has-text("Zona de proximidad")'


async def inject_axe(page):
    await page.add_script_tag(url=AXE_CDN)
    # Confirm it loaded
    ok = await page.evaluate("typeof window.axe === 'object'")
    assert ok, "axe-core failed to load"


async def run_axe(page, label: str):
    """Run axe against the whole document but only report violations that
    touch the radius circle or its tooltip. This keeps unrelated app-level
    findings out of the pass/fail signal for this test."""
    result = await page.evaluate(
        """async ({ circleSel }) => {
          const res = await window.axe.run(document, {
            resultTypes: ['violations'],
            rules: {
              region: { enabled: false },
              'landmark-one-main': { enabled: false },
            },
          });
          const circle = document.querySelector(circleSel);
          // Playwright's :has-text is not valid CSS — find the tooltip in JS.
          const tooltip = Array.from(document.querySelectorAll('[role="tooltip"]'))
            .find(el => (el.textContent || '').includes('Zona de proximidad')) || null;
          const inScope = (target) => {
            const el = document.querySelector(target);
            if (!el) return false;
            return (circle && (circle.contains(el) || el.contains(circle)))
              || (tooltip && (tooltip.contains(el) || el.contains(tooltip)));
          };
          const scoped = res.violations
            .map(v => ({
              id: v.id,
              impact: v.impact,
              help: v.help,
              nodes: v.nodes.filter(n => n.target.some(inScope))
                .map(n => ({ target: n.target, failureSummary: n.failureSummary })),
            }))
            .filter(v => v.nodes.length > 0);
          return scoped;
        }""",
        {"circleSel": CIRCLE_SELECTOR},
    )
    print(f"[axe:{label}] scoped violations:", json.dumps(result, indent=2))
    serious = [v for v in result if v["impact"] in ("serious", "critical")]
    assert not serious, f"axe {label}: serious/critical violations: {serious}"
    return result


async def touch_circle(page):
    await page.evaluate(
        """(sel) => {
          const el = document.querySelector(sel);
          const ev = new PointerEvent('pointerdown', {
            bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: true,
          });
          el.dispatchEvent(ev);
        }""",
        CIRCLE_SELECTOR,
    )


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(
            viewport={"width": 390, "height": 844},
            has_touch=True,
            is_mobile=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
        )
        page = await ctx.new_page()

        await page.goto("http://localhost:8080", wait_until="domcontentloaded")
        await page.evaluate("window.localStorage.setItem('soraGhost','1')")
        await page.evaluate("window.localStorage.setItem('soraProximityRadius','140')")
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_selector(CIRCLE_SELECTOR, timeout=8000)

        await inject_axe(page)

        # 1) Baseline: tooltip closed
        await page.screenshot(path=str(SS / "axe1_baseline.png"))
        await run_axe(page, "baseline")

        # 2) Tooltip opened via touch
        await touch_circle(page)
        await page.wait_for_selector(TOOLTIP_SELECTOR, timeout=2000)
        await page.screenshot(path=str(SS / "axe2_tooltip_open.png"))
        # re-inject in case a portal replaced the tree
        await inject_axe(page)
        await run_axe(page, "tooltip-open")

        # 3) After the 2.5s auto-close
        await page.wait_for_timeout(2800)
        assert await page.locator(TOOLTIP_SELECTOR).count() == 0, (
            "tooltip should have auto-closed before axe re-check"
        )
        await page.screenshot(path=str(SS / "axe3_after_autoclose.png"))
        await inject_axe(page)
        await run_axe(page, "after-autoclose")

        print("OK — axe-core mobile a11y checks passed for radius control + tooltip")
        await browser.close()


asyncio.run(main())
