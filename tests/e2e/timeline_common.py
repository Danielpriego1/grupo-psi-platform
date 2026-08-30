"""
Utilidades compartidas por las pruebas e2e del timeline de Continuidad Operativa.

Incluye:
- Matriz de viewports (densidades, rotación móvil y zoom 50%-200%).
- Temas: claro, oscuro y alto contraste (forced-colors).
- Activación determinista de los cinco nodos con scroll progresivo.
- Grabación de trace y vídeo, que solo se conserva cuando el caso falla.
"""

import os
import shutil

BASE_URL = os.environ.get("APP_URL", "http://localhost:8080")
ROOT = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(ROOT, "artifacts", "timeline")

# (nombre, ancho CSS, alto CSS, device_scale_factor)
VIEWPORTS = [
    # Densidades base
    ("mobile-375-dpr3", 375, 900, 3),
    ("mobile-414-dpr2", 414, 896, 2),
    ("tablet-768-dpr2", 768, 1024, 2),
    ("desktop-1280-dpr1", 1280, 900, 1),
    ("desktop-1920-dpr2", 1920, 1080, 2),
    # Rotación en móviles (retrato / paisaje)
    ("mobile-375x667-portrait", 375, 667, 2),
    ("mobile-667x375-landscape", 667, 375, 2),
    ("mobile-414x896-portrait", 414, 896, 2),
    ("mobile-896x414-landscape", 896, 414, 2),
]


def zoom_viewports(label: str, phys_width: int, phys_height: int, dpr: int):
    """Zoom del navegador simulado: el ancho CSS se divide por el zoom y el
    device_scale_factor se multiplica por él, igual que hace Chromium."""
    out = []
    for zoom in (0.5, 0.75, 1.0, 1.5, 2.0):
        css_w = round(phys_width / zoom)
        css_h = round(phys_height / zoom)
        pct = int(zoom * 100)
        out.append((f"{label}-zoom{pct}", css_w, css_h, round(dpr * zoom, 2)))
    return out


VIEWPORTS += zoom_viewports("desktop-1280", 1280, 900, 1)
VIEWPORTS += zoom_viewports("mobile-390", 390, 844, 2)

# (sufijo, kwargs extra para new_context, tema persistido en localStorage)
THEMES = [
    ("dark", {"color_scheme": "dark"}, "dark"),
    ("light", {"color_scheme": "light"}, "light"),
    (
        "contrast",
        {"color_scheme": "dark", "forced_colors": "active", "contrast": "more"},
        "dark",
    ),
]

# Combinaciones donde además del tema por defecto se prueban los tres temas
THEME_VIEWPORTS = ["mobile-375-dpr3", "tablet-768-dpr2", "desktop-1280-dpr1"]

# Estado de los nodos de la variante visible (escritorio u móvil según breakpoint)
ACTIVE_NODES_JS = """() => {
  const root = document.querySelector('#servicio-administrativo');
  if (!root) return [];
  const variants = [...root.querySelectorAll('[data-timeline-variant]')]
    .filter(b => b.offsetParent !== null);
  return variants.flatMap(b =>
    [...b.querySelectorAll('[data-timeline-node]')]
      .map(i => !!i.querySelector('.border-primary'))
  );
}"""


async def prepare_page(page, theme: str | None = None):
    """Fija el tema antes de renderizar y espera fuentes listas (evita
    diferencias de render entre este entorno y el runner de CI)."""
    await page.goto(BASE_URL, wait_until="domcontentloaded")
    if theme:
        await page.evaluate(
            "(t) => { try { localStorage.setItem('theme', t); } catch {} }", theme
        )
        await page.reload(wait_until="domcontentloaded")
    await page.evaluate("() => document.fonts && document.fonts.ready")
    await page.wait_for_timeout(900)


async def activate_all_nodes(page, timeline) -> list:
    """Scroll progresivo hasta que los cinco nodos de la variante renderizada
    estén iluminados (paisaje móvil y zoom 200% requieren varios pasos)."""
    await timeline.scroll_into_view_if_needed()
    await page.wait_for_timeout(700)
    active = await page.evaluate(ACTIVE_NODES_JS)
    for _ in range(24):
        if len(active) == 5 and all(active):
            break
        await page.mouse.wheel(0, 220)
        await page.wait_for_timeout(200)
        active = await page.evaluate(ACTIVE_NODES_JS)
    # Volver al inicio del bloque para que la captura sea comparable
    await timeline.scroll_into_view_if_needed()
    await page.wait_for_timeout(600)
    return active


async def new_recorded_context(browser, case: str, **kwargs):
    """Contexto con vídeo + trace activos. Usa finish_context() al terminar."""
    case_dir = os.path.join(ARTIFACTS_DIR, case)
    tmp_dir = os.path.join(case_dir, "_tmp")
    os.makedirs(tmp_dir, exist_ok=True)
    ctx = await browser.new_context(record_video_dir=tmp_dir, **kwargs)
    await ctx.tracing.start(screenshots=True, snapshots=True, sources=True)
    return ctx, case_dir


async def finish_context(ctx, case_dir: str, failed: bool):
    """Guarda trace y vídeo solo si el caso falló; si pasó, limpia todo."""
    tmp_dir = os.path.join(case_dir, "_tmp")
    if failed:
        await ctx.tracing.stop(path=os.path.join(case_dir, "trace.zip"))
    else:
        await ctx.tracing.stop()
    await ctx.close()  # cierra y escribe el vídeo

    if failed:
        for name in os.listdir(tmp_dir):
            if name.endswith(".webm"):
                shutil.move(
                    os.path.join(tmp_dir, name), os.path.join(case_dir, "video.webm")
                )
    shutil.rmtree(tmp_dir, ignore_errors=True)
    if not failed and os.path.isdir(case_dir) and not os.listdir(case_dir):
        os.rmdir(case_dir)
