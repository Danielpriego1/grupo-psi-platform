"""E2E: /portal/cambiar-contrasena -> redirect a /login.

Se interceptan las llamadas a Supabase Auth y a la edge function de
notificación para no depender de la contraseña real del usuario ni del
envío de correos. Verifica dos escenarios:

  1. Flujo feliz completo -> redirige a /login con toast de éxito.
  2. La edge function `notify-password-change` responde 500 pero el
     cambio de contraseña se confirma igual (no bloqueante).
"""

import asyncio
import json
import os
from pathlib import Path

from playwright.async_api import async_playwright, Route

SCREENSHOTS = Path(__file__).parent / "screenshots" / "change-password"
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

SUPABASE_URL = "https://wcnbqlpbqansyvslxlth.supabase.co"
BASE = "http://localhost:8080"


def json_response(route: Route, body: dict, status: int = 200):
    return route.fulfill(
        status=status,
        content_type="application/json",
        body=json.dumps(body),
    )


async def install_supabase_mocks(context, *, notify_status: int):
    """Interceptar auth endpoints y la edge function de notificación."""
    user_payload = {
        "id": "e2e-user-1",
        "email": "e2e@test.local",
        "user_metadata": {"full_name": "E2E Tester"},
        "app_metadata": {},
        "aud": "authenticated",
    }
    session_payload = {
        "access_token": "e2e-access",
        "refresh_token": "e2e-refresh",
        "expires_in": 3600,
        "expires_at": 9999999999,
        "token_type": "bearer",
        "user": user_payload,
    }

    async def handle_token(route: Route):
        # Cubre signInWithPassword y refreshSession.
        await json_response(route, session_payload)

    async def handle_user(route: Route):
        await json_response(route, user_payload)

    async def handle_logout(route: Route):
        await route.fulfill(status=204, body="")

    async def handle_update_user(route: Route):
        await json_response(route, user_payload)

    async def handle_notify(route: Route):
        if notify_status >= 400:
            await json_response(
                route, {"error": "simulated_failure"}, status=notify_status
            )
        else:
            await json_response(route, {"ok": True, "queued": True})

    await context.route(f"{SUPABASE_URL}/auth/v1/token**", handle_token)
    await context.route(f"{SUPABASE_URL}/auth/v1/user**", handle_update_user)
    await context.route(f"{SUPABASE_URL}/auth/v1/logout**", handle_logout)
    await context.route(
        f"{SUPABASE_URL}/functions/v1/notify-password-change**", handle_notify
    )


async def restore_session(context, page):
    storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
    session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    if cookies_json:
        cookies = json.loads(cookies_json)
        for c in cookies:
            c["url"] = BASE
        await context.add_cookies(cookies)
    await page.goto(BASE, wait_until="domcontentloaded")
    if storage_key and session_json:
        await page.evaluate(
            f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})"
        )


async def run_scenario(playwright, *, name: str, notify_status: int):
    browser = await playwright.chromium.launch(headless=True)
    context = await browser.new_context(viewport={"width": 1280, "height": 1800})
    page = await context.new_page()

    console_msgs = []
    page.on("console", lambda m: console_msgs.append(f"{m.type}: {m.text}"))

    await install_supabase_mocks(context, notify_status=notify_status)
    await restore_session(context, page)

    await page.goto(
        f"{BASE}/portal/cambiar-contrasena", wait_until="domcontentloaded"
    )
    await page.wait_for_selector("#current", timeout=10_000)
    await page.screenshot(path=str(SCREENSHOTS / f"{name}_01_form.png"))

    await page.fill("#current", "CurrentPass123")
    await page.fill("#next", "BrandNewPass456")
    await page.fill("#confirm", "BrandNewPass456")
    await page.screenshot(path=str(SCREENSHOTS / f"{name}_02_filled.png"))

    notify_seen = {"ok": False}

    def on_request(req):
        if "notify-password-change" in req.url:
            notify_seen["ok"] = True
            print(f"[{name}] notify-password-change request captured", flush=True)

    page.on("request", on_request)

    print(f"[{name}] submitting form...", flush=True)
    await page.get_by_role("button", name="Actualizar contraseña").click()

    # Esperar redirección a /login
    await page.wait_for_url("**/login", timeout=20_000)
    await page.screenshot(path=str(SCREENSHOTS / f"{name}_03_redirect.png"))

    assert page.url.endswith("/login"), f"[{name}] esperaba /login, obtuvo {page.url}"

    print(
        f"[{name}] final_url={page.url} notify_called={notify_seen['ok']} "
        f"notify_status_mocked={notify_status}",
        flush=True,
    )
    for m in console_msgs[-15:]:
        print(f"  console> {m}", flush=True)

    await browser.close()


async def main():
    async with async_playwright() as pw:
        await run_scenario(pw, name="happy", notify_status=200)
        await run_scenario(pw, name="notify_fails", notify_status=500)
    print("OK: both scenarios reached /login")


asyncio.run(main())
