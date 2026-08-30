"""
Rendimiento del timeline de Continuidad Operativa.

Mide, con la animación real (sin reduced-motion):
1. Tiempo de activación de los cinco nodos (primer nodo -> quinto nodo) y
   tiempo desde que la sección entra en pantalla hasta el quinto nodo.
2. Frames durante la animación: FPS medio, peor frame y porcentaje de frames
   largos (> 32 ms, es decir frames perdidos a 60 Hz).

Umbrales (variables de entorno):
    TIMELINE_PERF_MAX_ACTIVATION_MS    default 4000
    TIMELINE_PERF_MAX_LONG_FRAME_PCT   default 20
    TIMELINE_PERF_MIN_AVG_FPS          default 30
"""

import asyncio
import json
import os
import sys

from playwright.async_api import async_playwright

from timeline_common import BASE_URL, prepare_page  # noqa: E402

MAX_ACTIVATION_MS = float(os.environ.get("TIMELINE_PERF_MAX_ACTIVATION_MS", "4000"))
MAX_LONG_FRAME_PCT = float(os.environ.get("TIMELINE_PERF_MAX_LONG_FRAME_PCT", "20"))
MIN_AVG_FPS = float(os.environ.get("TIMELINE_PERF_MIN_AVG_FPS", "30"))

CASES = [
    ("desktop-1280", 1280, 900, 1),
    ("mobile-390", 390, 844, 2),
]

# Observa el DOM y anota el instante en que cada nodo se ilumina, además de
# registrar la duración de cada frame durante toda la animación.
INSTRUMENT_JS = """() => {
  const root = document.querySelector('#servicio-administrativo');
  const variant = [...root.querySelectorAll('[data-timeline-variant]')]
    .find(b => b.offsetParent !== null);
  const nodes = [...variant.querySelectorAll('[data-timeline-node]')];

  const state = {
    sectionVisibleAt: null,
    activations: new Array(nodes.length).fill(null),
    frames: [],
  };
  window.__timelinePerf = state;

  new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && state.sectionVisibleAt === null) {
        state.sectionVisibleAt = performance.now();
      }
    }
  }, { threshold: 0.01 }).observe(root);

  const mo = new MutationObserver(() => {
    nodes.forEach((n, i) => {
      if (state.activations[i] === null && n.querySelector('.border-primary')) {
        state.activations[i] = performance.now();
      }
    });
  });
  mo.observe(root, { attributes: true, subtree: true, attributeFilter: ['class', 'style'] });

  let last = performance.now();
  const tick = (now) => {
    // Se guarda { t: instante, d: duración } para poder recortar la medición
    // exactamente a la ventana de la animación del timeline.
    state.frames.push({ t: now, d: now - last });
    last = now;
    if (state.frames.length < 1200) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}"""

# Margen tras el último nodo para incluir el final de la transición (700ms CSS)
ANIMATION_TAIL_MS = 800


def summarize(state: dict) -> dict:
    acts = [a for a in state["activations"] if a is not None]
    start = state["sectionVisibleAt"]
    end = (acts[-1] + ANIMATION_TAIL_MS) if acts else None

    raw = [f for f in state["frames"] if f["d"] > 0][1:]
    # Solo los frames de la ventana de animación del timeline: el resto del
    # scroll (imágenes, mapa, otras secciones) no es lo que medimos aquí.
    window = (
        [f for f in raw if start is not None and start <= f["t"] <= end]
        if end is not None
        else raw
    )
    frames = [f["d"] for f in (window or raw)]
    long_frames = [f for f in frames if f > 32]
    avg = sum(frames) / len(frames) if frames else 0
    return {
        "nodos_activados": len(acts),
        "activacion_total_ms": round(acts[-1] - acts[0], 1) if len(acts) > 1 else 0,
        "visible_a_ultimo_nodo_ms": (
            round(acts[-1] - start, 1) if acts and start is not None else None
        ),
        "fps_medio": round(1000 / avg, 1) if avg else 0,
        "peor_frame_ms": round(max(frames), 1) if frames else 0,
        "frames_largos_pct": round(100 * len(long_frames) / len(frames), 1)
        if frames
        else 0,
        "frames_medidos": len(frames),
    }



async def run() -> int:
    failures = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for name, width, height, dpr in CASES:
            ctx = await browser.new_context(
                viewport={"width": width, "height": height},
                device_scale_factor=dpr,
                reduced_motion="no-preference",
            )
            page = await ctx.new_page()
            await prepare_page(page)
            await page.evaluate(INSTRUMENT_JS)

            # Scroll controlado y uniforme hasta activar toda la sección
            for _ in range(30):
                await page.mouse.wheel(0, 200)
                await page.wait_for_timeout(60)
            await page.wait_for_timeout(1200)

            state = await page.evaluate("() => window.__timelinePerf")
            m = summarize(state)
            print(f"{name}: {json.dumps(m, ensure_ascii=False)}")

            if m["nodos_activados"] != 5:
                failures.append(f"{name}: solo {m['nodos_activados']}/5 nodos activados")
            if m["activacion_total_ms"] > MAX_ACTIVATION_MS:
                failures.append(
                    f"{name}: activación {m['activacion_total_ms']}ms > {MAX_ACTIVATION_MS}ms"
                )
            if m["frames_largos_pct"] > MAX_LONG_FRAME_PCT:
                failures.append(
                    f"{name}: frames largos {m['frames_largos_pct']}% > {MAX_LONG_FRAME_PCT}%"
                )
            if m["fps_medio"] < MIN_AVG_FPS:
                failures.append(f"{name}: fps medio {m['fps_medio']} < {MIN_AVG_FPS}")

            await ctx.close()
        await browser.close()

    if failures:
        print("\nFALLOS:")
        for f in failures:
            print(" -", f)
    else:
        print("\nRendimiento OK en todos los casos")
    return len(failures)


if __name__ == "__main__":
    print("URL:", BASE_URL)
    sys.exit(1 if asyncio.run(run()) else 0)
