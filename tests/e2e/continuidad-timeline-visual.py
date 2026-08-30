"""
Pruebas visuales de regresión del timeline de Continuidad Operativa.

Captura el bloque #servicio-administrativo en los mismos viewports y densidades
de píxeles usados en la validación manual, y compara contra las capturas base
guardadas en tests/e2e/screenshots/timeline/.

Uso:
    python3 tests/e2e/continuidad-timeline-visual.py            # compara
    python3 tests/e2e/continuidad-timeline-visual.py --update   # regenera base
"""

import asyncio
import os
import sys

from PIL import Image, ImageChops
from playwright.async_api import async_playwright

BASE_URL = os.environ.get("APP_URL", "http://localhost:8080")
ROOT = os.path.dirname(os.path.abspath(__file__))
BASELINE_DIR = os.path.join(ROOT, "screenshots", "timeline")
ACTUAL_DIR = os.path.join(ROOT, "screenshots", "timeline", "actual")
DIFF_TOLERANCE = 0.005  # 0.5% de píxeles distintos

VIEWPORTS = [
    ("mobile-375-dpr3", 375, 900, 3),
    ("mobile-414-dpr2", 414, 896, 2),
    ("tablet-768-dpr2", 768, 1024, 2),
    ("desktop-1280-dpr1", 1280, 900, 1),
    ("desktop-1920-dpr2", 1920, 1080, 2),
]


def compare(baseline_path: str, actual_path: str) -> float:
    a = Image.open(baseline_path).convert("RGB")
    b = Image.open(actual_path).convert("RGB")
    if a.size != b.size:
        return 1.0
    diff = ImageChops.difference(a, b)
    changed = sum(1 for px in diff.convert("L").tobytes() if px > 12)
    return changed / (a.size[0] * a.size[1])


async def capture(update: bool) -> int:
    os.makedirs(BASELINE_DIR, exist_ok=True)
    os.makedirs(ACTUAL_DIR, exist_ok=True)
    failures = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for name, width, height, dpr in VIEWPORTS:
            ctx = await browser.new_context(
                viewport={"width": width, "height": height},
                device_scale_factor=dpr,
                reduced_motion="reduce",  # estado final estable y determinista
            )
            page = await ctx.new_page()
            await page.goto(BASE_URL, wait_until="domcontentloaded")
            await page.wait_for_timeout(1200)

            timeline = page.locator("#servicio-administrativo")
            await timeline.scroll_into_view_if_needed()
            await page.wait_for_timeout(1200)

            # Los cinco nodos visibles deben estar iluminados antes de capturar
            active = await page.evaluate(
                """() => {
                  const root = document.querySelector('#servicio-administrativo');
                  const blocks = [...root.querySelectorAll(':scope > div')].slice(1);
                  const visible = blocks.filter(b => b.offsetParent !== null);
                  return visible.flatMap(b =>
                    [...b.querySelectorAll('[role=listitem]')]
                      .map(i => !!i.querySelector('.border-primary'))
                  );
                }"""
            )
            if len(active) != 5 or not all(active):
                print(f"FAIL {name}: nodos activos = {active}")
                failures += 1

            actual_path = os.path.join(ACTUAL_DIR, f"{name}.png")
            baseline_path = os.path.join(BASELINE_DIR, f"{name}.png")
            await timeline.screenshot(path=actual_path)

            if update or not os.path.exists(baseline_path):
                Image.open(actual_path).save(baseline_path)
                print(f"BASE {name}: captura base guardada")
            else:
                ratio = compare(baseline_path, actual_path)
                if ratio > DIFF_TOLERANCE:
                    print(f"FAIL {name}: diferencia visual {ratio:.2%}")
                    failures += 1
                else:
                    print(f"OK   {name}: diferencia {ratio:.2%}")

            await ctx.close()
        await browser.close()

    return failures


if __name__ == "__main__":
    update = "--update" in sys.argv
    sys.exit(1 if asyncio.run(capture(update)) else 0)
