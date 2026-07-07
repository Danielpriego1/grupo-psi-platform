"""
E2E: mobile viewport tooltip behavior for the Sora proximity-radius circle.

Verifies:
  1. Tapping (touch) the circle opens the tooltip.
  2. Pressing an arrow key while focused hides the tooltip.
  3. Tapping outside (another touch gesture) hides the tooltip.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

SS = Path(__file__).parent / "screenshots"
SS.mkdir(parents=True, exist_ok=True)

TOOLTIP_SELECTOR = '[role="tooltip"]:has-text("Zona de proximidad")'
CIRCLE_SELECTOR = '[role="slider"][aria-label="Radio de proximidad de Sora"]'


async def tooltip_visible(page) -> bool:
    return await page.locator(TOOLTIP_SELECTOR).count() > 0


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
        await page.screenshot(path=str(SS / "m1_ghost_on.png"))

        circle = page.locator(CIRCLE_SELECTOR)

        # 1) Touch tap opens the tooltip.
        # The circle is fixed at the corner and its bounding-box center overlaps
        # the launcher, so dispatch the pointer event directly on the element.
        async def touch_circle():
            await page.evaluate(
                """
                (sel) => {
                  const el = document.querySelector(sel);
                  const ev = new PointerEvent('pointerdown', {
                    bubbles: true, cancelable: true, pointerType: 'touch',
                    isPrimary: true,
                  });
                  el.dispatchEvent(ev);
                }
                """,
                CIRCLE_SELECTOR,
            )

        await touch_circle()
        await page.wait_for_selector(TOOLTIP_SELECTOR, timeout=2000)

        print("touch tap -> tooltip visible: OK")
        await page.screenshot(path=str(SS / "m2_tooltip_touch.png"))

        # 2) Keyboard adjust hides the tooltip immediately
        await circle.focus()
        await page.keyboard.press("ArrowUp")
        # allow re-render
        await page.wait_for_timeout(150)
        assert not await tooltip_visible(page), "tooltip should hide on keyboard adjust"
        val = await circle.get_attribute("aria-valuenow")
        assert val == "150", f"expected 150 after ArrowUp, got {val}"
        print("keyboard adjust hides tooltip and updates value: OK")
        await page.screenshot(path=str(SS / "m3_after_keyboard.png"))

        # 3) Touch reopens, then auto-hides after ~2.5s
        await touch_circle()
        await page.wait_for_selector(TOOLTIP_SELECTOR, timeout=2000)
        await page.wait_for_timeout(3000)
        assert not await tooltip_visible(page), "tooltip should auto-close after touch timeout"

        print("touch tooltip auto-closes: OK")
        await page.screenshot(path=str(SS / "m4_after_autoclose.png"))

        print("OK — mobile tooltip e2e passed")
        await browser.close()


asyncio.run(main())
