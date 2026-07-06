import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

SS = Path(__file__).parent / "screenshots"
SS.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await ctx.new_page()

        # Enable ghost mode so the radius circle renders
        await page.goto("http://localhost:8080", wait_until="domcontentloaded")
        await page.evaluate("window.localStorage.setItem('soraGhost','1')")
        await page.evaluate("window.localStorage.setItem('soraProximityRadius','140')")
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_selector('[role="slider"][aria-label="Radio de proximidad de Sora"]', timeout=8000)
        await page.screenshot(path=str(SS / "1_ghost_on.png"))

        circle = page.locator('[role="slider"][aria-label="Radio de proximidad de Sora"]')
        await circle.focus()
        active_label = await page.evaluate("document.activeElement && document.activeElement.getAttribute('aria-label')")
        print("focused aria-label:", active_label)
        assert active_label == "Radio de proximidad de Sora", f"circle not focused: {active_label}"

        # ArrowUp x 3  →  140 → 170
        for _ in range(3):
            await page.keyboard.press("ArrowUp")
        await page.wait_for_timeout(300)
        val = await circle.get_attribute("aria-valuenow")
        print("aria-valuenow after 3 ArrowUp:", val)
        assert val == "170", f"expected 170, got {val}"

        # Slam to max, then push once more to hit boundary
        await page.keyboard.press("End")
        await page.wait_for_timeout(200)
        max_val = await circle.get_attribute("aria-valuenow")
        print("after End:", max_val)
        assert max_val == "320"
        await page.keyboard.press("ArrowUp")
        await page.wait_for_timeout(300)
        invalid = await circle.get_attribute("aria-invalid")
        print("aria-invalid at max:", invalid)
        assert invalid == "true", f"expected aria-invalid=true at max boundary, got {invalid}"
        await page.screenshot(path=str(SS / "2_boundary_max.png"))

        # Home → min, then push down → boundary min
        await page.keyboard.press("Home")
        await page.wait_for_timeout(200)
        assert (await circle.get_attribute("aria-valuenow")) == "60"
        await page.keyboard.press("ArrowDown")
        await page.wait_for_timeout(300)
        vtext = await circle.get_attribute("aria-valuetext")
        print("aria-valuetext at min boundary:", vtext)
        assert "mínimo alcanzado" in (vtext or "")

        # localStorage persistence
        stored = await page.evaluate("window.localStorage.getItem('soraProximityRadius')")
        print("localStorage soraProximityRadius:", stored)
        assert stored == "60"

        await page.screenshot(path=str(SS / "3_boundary_min.png"))
        print("OK — radius a11y e2e passed")
        await browser.close()

asyncio.run(main())
