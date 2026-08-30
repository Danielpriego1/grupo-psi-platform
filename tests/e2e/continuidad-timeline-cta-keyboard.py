"""
Teclado: el CTA de Continuidad Operativa salta al bloque del ciclo de vida y
deja el foco en él, en TODOS los viewports (densidades, rotación y zoom).

Para cada viewport:
1. Se llega al CTA solo con Tab (sin clic).
2. Se activa con Enter y se comprueba que #servicio-administrativo recibe foco
   y queda visible en el viewport.
3. Se repite la activación con Space.
4. Se captura el elemento enfocado para revisar el anillo de foco.

Al fallar un caso se guardan trace, vídeo y captura en
tests/e2e/artifacts/timeline/<caso>/.
"""

import asyncio
import os
import sys

from playwright.async_api import async_playwright

from timeline_common import (  # noqa: E402
    ARTIFACTS_DIR,
    VIEWPORTS,
    finish_context,
    new_recorded_context,
    prepare_page,
)

ROOT = os.path.dirname(os.path.abspath(__file__))
SHOTS_DIR = os.path.join(ROOT, "screenshots", "timeline-cta")
CTA_TEXT = "Servicio Administrativo y Personalizado"

FOCUS_STATE_JS = """() => {
  const target = document.querySelector('#servicio-administrativo');
  const rect = target.getBoundingClientRect();
  return {
    focused: document.activeElement === target,
    activeId: document.activeElement?.id || document.activeElement?.tagName,
    visible: rect.top < window.innerHeight && rect.bottom > 0,
    tabindex: target.getAttribute('tabindex'),
  };
}"""


async def focus_cta(page) -> bool:
    """Tab hasta que el CTA de la sección tenga el foco (sin usar el ratón)."""
    cta = page.get_by_role("link", name=CTA_TEXT)
    await cta.scroll_into_view_if_needed()
    await page.wait_for_timeout(300)
    await page.evaluate("() => document.body.focus()")
    for _ in range(80):
        await page.keyboard.press("Tab")
        focused = await page.evaluate(
            "(t) => (document.activeElement?.textContent || '').includes(t)", CTA_TEXT
        )
        if focused:
            return True
    return False


async def run() -> int:
    os.makedirs(SHOTS_DIR, exist_ok=True)
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    failures = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for name, width, height, dpr in VIEWPORTS:
            case = f"cta-{name}"
            ctx, case_dir = await new_recorded_context(
                browser,
                case,
                viewport={"width": width, "height": height},
                device_scale_factor=dpr,
            )
            page = await ctx.new_page()
            failed = False
            try:
                await prepare_page(page)

                for key in ("Enter", " "):
                    reached = await focus_cta(page)
                    if not reached:
                        print(f"FAIL {name}: el CTA no es alcanzable con Tab")
                        failed = True
                        break

                    await page.keyboard.press(key)
                    await page.wait_for_timeout(800)
                    state = await page.evaluate(FOCUS_STATE_JS)
                    label = "Enter" if key == "Enter" else "Space"
                    if not state["focused"]:
                        print(
                            f"FAIL {name} [{label}]: foco en {state['activeId']} "
                            "en lugar del bloque de continuidad"
                        )
                        failed = True
                    elif not state["visible"]:
                        print(f"FAIL {name} [{label}]: el bloque no queda visible")
                        failed = True
                    else:
                        print(f"OK   {name} [{label}]: foco y visibilidad correctos")

                shot = os.path.join(SHOTS_DIR, f"{name}.png")
                await page.locator("#servicio-administrativo").screenshot(path=shot)
                if failed:
                    os.makedirs(case_dir, exist_ok=True)
                    await page.screenshot(path=os.path.join(case_dir, "page.png"))
            except Exception as exc:  # noqa: BLE001
                print(f"FAIL {name}: excepción {exc!r}")
                failed = True
            finally:
                failures += 1 if failed else 0
                await finish_context(ctx, case_dir, failed)
        await browser.close()

    total = len(VIEWPORTS)
    print(f"\nResumen CTA teclado: {total - failures}/{total} viewports OK")
    return failures


if __name__ == "__main__":
    sys.exit(1 if asyncio.run(run()) else 0)
