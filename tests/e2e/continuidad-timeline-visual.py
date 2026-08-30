"""
Pruebas visuales de regresión del timeline de Continuidad Operativa.

Captura el bloque #servicio-administrativo en una matriz de viewports que cubre
densidades de píxeles, zoom del navegador (50%-200%) y rotación en móviles, más
temas claro / oscuro / alto contraste en tres viewports clave. Compara contra
las capturas base de tests/e2e/screenshots/timeline/.

Modos:
    python3 tests/e2e/continuidad-timeline-visual.py             # compara
    python3 tests/e2e/continuidad-timeline-visual.py --update    # regenera base
    python3 tests/e2e/continuidad-timeline-visual.py --structural-only
        # solo verifica que los 5 nodos se activen (sin pixel-diff): es el
        # chequeo que debe bloquear el merge, estable entre entornos.

Variables de entorno:
    APP_URL                    (default http://localhost:8080)
    TIMELINE_DIFF_TOLERANCE    porcentaje de píxeles distintos tolerado (0.005)
    TIMELINE_PIXEL_THRESHOLD   umbral por canal para ignorar antialiasing (24)

Al fallar un caso se guardan trace, vídeo, base, actual y diff amplificado en
tests/e2e/artifacts/timeline/<caso>/.
"""

import asyncio
import os
import sys

from PIL import Image, ImageChops
from playwright.async_api import async_playwright

from timeline_common import (  # noqa: E402
    ARTIFACTS_DIR,
    THEMES,
    THEME_VIEWPORTS,
    VIEWPORTS,
    activate_all_nodes,
    finish_context,
    new_recorded_context,
    prepare_page,
)

ROOT = os.path.dirname(os.path.abspath(__file__))
BASELINE_DIR = os.path.join(ROOT, "screenshots", "timeline")
ACTUAL_DIR = os.path.join(BASELINE_DIR, "actual")
DIFF_TOLERANCE = float(os.environ.get("TIMELINE_DIFF_TOLERANCE", "0.005"))
PIXEL_THRESHOLD = int(os.environ.get("TIMELINE_PIXEL_THRESHOLD", "24"))


def build_cases():
    """(nombre, ancho, alto, dpr, kwargs de contexto, tema)"""
    cases = [(n, w, h, d, {}, None) for n, w, h, d in VIEWPORTS]
    by_name = {n: (w, h, d) for n, w, h, d in VIEWPORTS}
    for vp in THEME_VIEWPORTS:
        w, h, d = by_name[vp]
        for suffix, kwargs, theme in THEMES:
            cases.append((f"{vp}-{suffix}", w, h, d, kwargs, theme))
    return cases


def compare(baseline_path: str, actual_path: str, diff_path: str | None = None):
    a = Image.open(baseline_path).convert("RGB")
    b = Image.open(actual_path).convert("RGB")
    if a.size != b.size:
        return 1.0, f"tamaño distinto base={a.size} actual={b.size}"
    diff = ImageChops.difference(a, b).convert("L")
    data = diff.tobytes()
    changed = sum(1 for px in data if px > PIXEL_THRESHOLD)
    ratio = changed / (a.size[0] * a.size[1])
    if diff_path:
        # Diferencia amplificada para inspección visual
        diff.point(lambda p: min(255, p * 8)).save(diff_path)
    return ratio, ""


async def run(update: bool, structural_only: bool) -> int:
    os.makedirs(BASELINE_DIR, exist_ok=True)
    os.makedirs(ACTUAL_DIR, exist_ok=True)
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    failures = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for name, width, height, dpr, extra, theme in build_cases():
            ctx, case_dir = await new_recorded_context(
                browser,
                name,
                viewport={"width": width, "height": height},
                device_scale_factor=dpr,
                reduced_motion="reduce",  # estado final estable y determinista
                **extra,
            )
            page = await ctx.new_page()
            failed = False
            try:
                await prepare_page(page, theme)
                timeline = page.locator("#servicio-administrativo")
                active = await activate_all_nodes(page, timeline)
                if len(active) != 5 or not all(active):
                    print(f"FAIL {name}: nodos activos = {active}")
                    failed = True

                actual_path = os.path.join(ACTUAL_DIR, f"{name}.png")
                baseline_path = os.path.join(BASELINE_DIR, f"{name}.png")
                await timeline.screenshot(path=actual_path)

                if structural_only:
                    if not failed:
                        print(f"OK   {name}: 5/5 nodos activos")
                elif update or not os.path.exists(baseline_path):
                    Image.open(actual_path).save(baseline_path)
                    print(f"BASE {name}: captura base guardada")
                else:
                    os.makedirs(case_dir, exist_ok=True)
                    ratio, note = compare(
                        baseline_path,
                        actual_path,
                        os.path.join(case_dir, "diff.png"),
                    )
                    if ratio > DIFF_TOLERANCE:
                        extra_note = f" ({note})" if note else ""
                        print(
                            f"FAIL {name}: diferencia visual {ratio:.4%} "
                            f"(tolerancia {DIFF_TOLERANCE:.4%}){extra_note}"
                        )
                        failed = True
                        Image.open(actual_path).save(
                            os.path.join(case_dir, "actual.png")
                        )
                        Image.open(baseline_path).save(
                            os.path.join(case_dir, "baseline.png")
                        )
                    else:
                        print(f"OK   {name}: diferencia {ratio:.4%}")
                        os.remove(os.path.join(case_dir, "diff.png"))
            except Exception as exc:  # noqa: BLE001
                print(f"FAIL {name}: excepción {exc!r}")
                failed = True
            finally:
                failures += 1 if failed else 0
                await finish_context(ctx, case_dir, failed)

        await browser.close()

    total = len(build_cases())
    print(f"\nResumen: {total - failures}/{total} casos OK")
    return failures


if __name__ == "__main__":
    sys.exit(
        1
        if asyncio.run(
            run("--update" in sys.argv, "--structural-only" in sys.argv)
        )
        else 0
    )
