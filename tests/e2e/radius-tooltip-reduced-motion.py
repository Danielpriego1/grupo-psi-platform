"""
E2E (mobile + prefers-reduced-motion): the Sora proximity-radius tooltip must
stay open when the user has requested reduced motion, instead of auto-closing
after ~2.5s. It should still close on keyboard adjustments (that hide is not a
motion effect but an ARIA-collision safeguard).
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
            reduced_motion="reduce",
        )
        page = await ctx.new_page()

        await page.goto("http://localhost:8080", wait_until="domcontentloaded")
        await page.evaluate("window.localStorage.setItem('soraGhost','1')")
        await page.evaluate("window.localStorage.setItem('soraProximityRadius','140')")
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_selector(CIRCLE_SELECTOR, timeout=8000)

        # Sanity: matchMedia reports reduce
        reduced = await page.evaluate(
            "window.matchMedia('(prefers-reduced-motion: reduce)').matches"
        )
        assert reduced is True, "context should advertise prefers-reduced-motion: reduce"

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

        # 1) Touch opens the tooltip.
        await touch_circle()
        await page.wait_for_selector(TOOLTIP_SELECTOR, timeout=2000)
        await page.screenshot(path=str(SS / "rm1_tooltip_touch.png"))

        # 2) Wait beyond the normal 2.5s auto-close window — tooltip must remain.
        await page.wait_for_timeout(3200)
        assert await tooltip_visible(page), (
            "with prefers-reduced-motion the tooltip must NOT auto-close after 2.5s"
        )
        await page.screenshot(path=str(SS / "rm2_still_open_after_3s.png"))
        print("reduced-motion keeps tooltip open past 2.5s: OK")

        # 3) Keyboard adjustment still dismisses the tooltip (ARIA-collision guard).
        circle = page.locator(CIRCLE_SELECTOR)
        await circle.focus()
        await page.keyboard.press("ArrowUp")
        await page.wait_for_timeout(500)
        assert not await tooltip_visible(page), (
            "tooltip should hide on keyboard adjust even under reduced motion"
        )
        print("keyboard adjust still hides tooltip: OK")
        await page.screenshot(path=str(SS / "rm3_after_keyboard.png"))

        print("OK — reduced-motion mobile tooltip e2e passed")
        await browser.close()


asyncio.run(main())
