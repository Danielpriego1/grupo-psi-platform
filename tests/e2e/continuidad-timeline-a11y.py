"""
Accesibilidad del timeline de Continuidad Operativa.

Verifica:
1. prefers-reduced-motion: los nodos quedan iluminados sin transiciones.
2. Navegación por teclado: el CTA de la sección es alcanzable con Tab y los
   nodos (contenido no interactivo) no crean paradas de tabulación inútiles.
3. Contraste y reglas axe-core dentro de la sección.
"""

import asyncio
import json
import sys

from playwright.async_api import async_playwright

BASE_URL = "http://localhost:8080"
AXE = "https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js"


async def run():
    failures = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # --- 1. prefers-reduced-motion ---
        ctx = await browser.new_context(
            viewport={"width": 1280, "height": 900}, reduced_motion="reduce"
        )
        page = await ctx.new_page()
        await page.goto(BASE_URL, wait_until="domcontentloaded")
        await page.wait_for_timeout(1200)
        await page.locator("#servicio-administrativo").scroll_into_view_if_needed()
        await page.wait_for_timeout(600)

        state = await page.evaluate(
            """() => {
              const root = document.querySelector('#servicio-administrativo');
              const blocks = [...root.querySelectorAll(':scope > div')].slice(1)
                .filter(b => b.offsetParent !== null);
              const items = blocks.flatMap(b => [...b.querySelectorAll('[role=listitem]')]);
              return items.map(i => ({
                on: !!i.querySelector('.border-primary'),
                property: getComputedStyle(i).transitionProperty,
                opacity: getComputedStyle(i).opacity,
              }));
            }"""
        )
        if len(state) != 5 or not all(s["on"] for s in state):
            failures.append(f"reduced-motion: nodos no iluminados -> {state}")
        if any(s["property"] != "none" for s in state):
            failures.append(f"reduced-motion: transiciones activas -> {state}")
        print("reduced-motion:", json.dumps(state, ensure_ascii=False))

        # --- 2. Teclado ---
        await page.keyboard.press("Escape")
        await page.evaluate(
            "() => document.querySelector('#servicio-administrativo').scrollIntoView()"
        )
        tab_stops = await page.evaluate(
            """() => {
              const root = document.querySelector('#continuidad-operativa');
              const sel = 'a[href],button,[tabindex]:not([tabindex="-1"]),input,select,textarea';
              return [...root.querySelectorAll(sel)].map(el => ({
                tag: el.tagName,
                name: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 60),
                tabIndex: el.tabIndex,
                focusVisible: !!el.className.match(/focus-visible|focus:/),
              }));
            }"""
        )
        print("tab stops:", json.dumps(tab_stops, ensure_ascii=False, indent=1))
        if not tab_stops:
            failures.append("teclado: la sección no tiene ningún elemento enfocable (CTA)")
        for stop in tab_stops:
            if stop["tabIndex"] > 0:
                failures.append(f"teclado: tabIndex positivo en {stop}")
            if not stop["name"]:
                failures.append(f"teclado: elemento enfocable sin nombre accesible {stop}")

        # Foco real desde el primer stop
        focused = await page.evaluate(
            """async () => {
              const root = document.querySelector('#continuidad-operativa');
              const el = root.querySelector('a[href],button');
              el?.focus();
              const active = document.activeElement;
              return {
                isTarget: active === el,
                outline: active ? getComputedStyle(active).outlineStyle : null,
                ring: active ? getComputedStyle(active).boxShadow !== 'none' : null,
              };
            }"""
        )
        print("foco CTA:", focused)
        if not focused["isTarget"]:
            failures.append("teclado: el CTA no recibe foco programático")

        # --- 3. axe-core sobre la sección ---
        # El CTA se revela con fade; hay que esperar su estado final para que
        # axe no mida el contraste sobre un elemento semitransparente.
        await page.evaluate(
            "() => document.querySelector('#continuidad-operativa a[href^=\"#\"]').scrollIntoView()"
        )
        await page.wait_for_function(
            "() => { const el = document.querySelector('#continuidad-operativa a[href^=\"#\"]').closest('div');"
            " return getComputedStyle(el).opacity === '1'; }"
        )
        await page.wait_for_timeout(400)
        await page.add_script_tag(url=AXE)
        results = await page.evaluate(
            """async () => {
              const r = await axe.run('#continuidad-operativa', {
                runOnly: ['wcag2a', 'wcag2aa'],
              });
              return r.violations.map(v => ({
                id: v.id, impact: v.impact, nodes: v.nodes.length,
                target: v.nodes[0]?.target?.[0] ?? null,
              }));
            }"""
        )
        print("axe violations:", json.dumps(results, ensure_ascii=False, indent=1))
        if results:
            failures.append(f"axe: {len(results)} violaciones -> {results}")

        await ctx.close()
        await browser.close()

    if failures:
        print("\nFALLOS:")
        for f in failures:
            print(" -", f)
        return 1
    print("\nTodo OK: reduced-motion, teclado y axe sin violaciones.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(run()))
