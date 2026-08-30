import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ContinuidadOperativaSection } from "../ContinuidadOperativaSection";

type Cb = (entries: IntersectionObserverEntry[]) => void;

interface FakeObserver {
  cb: Cb;
  targets: Set<Element>;
}

const observers: FakeObserver[] = [];

class MockIntersectionObserver {
  cb: Cb;
  targets = new Set<Element>();

  constructor(cb: Cb) {
    this.cb = cb;
    observers.push(this);
  }
  observe(el: Element) {
    this.targets.add(el);
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
  disconnect() {
    this.targets.clear();
  }
  takeRecords() {
    return [];
  }
}

/** Dispara la entrada en pantalla de un elemento en todos los observers activos. */
function enterViewport(el: Element) {
  act(() => {
    for (const obs of observers) {
      if (!obs.targets.has(el)) continue;
      obs.cb([
        { target: el, isIntersecting: true } as unknown as IntersectionObserverEntry,
      ]);
    }
    // El hook agrupa los cambios en requestAnimationFrame
    vi.runAllTimers();
  });
}

function isNodeActive(item: HTMLElement) {
  const circle = item.querySelector(".border-primary");
  return Boolean(circle);
}

describe("ContinuidadOperativaSection · timeline", () => {
  beforeEach(() => {
    observers.length = 0;
    vi.useFakeTimers();
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    // requestAnimationFrame -> timers falsos deterministas
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
      setTimeout(() => cb(performance.now()), 0) as unknown as number,
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) =>
      clearTimeout(id as unknown as NodeJS.Timeout),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const renderSection = () =>
    render(
      <MemoryRouter>
        <ContinuidadOperativaSection />
      </MemoryRouter>,
    );

  it("mantiene los nodos apagados hasta que entran en pantalla", () => {
    renderSection();
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThanOrEqual(5);
    items.forEach((item) => expect(isNodeActive(item)).toBe(false));
  });

  it("activa cada nodo exactamente cuando entra en pantalla", () => {
    renderSection();
    const items = screen.getAllByRole("listitem");

    // Los 5 primeros listitems corresponden al timeline de escritorio
    const timelineItems = items.slice(0, 5);

    timelineItems.forEach((item, index) => {
      enterViewport(item);
      timelineItems.forEach((other, otherIndex) => {
        expect(isNodeActive(other)).toBe(otherIndex <= index);
      });
    });
  });

  it("no reactiva ni desactiva un nodo ya iluminado", () => {
    renderSection();
    const [first] = screen.getAllByRole("listitem");

    enterViewport(first);
    expect(isNodeActive(first)).toBe(true);

    // Segunda intersección (p. ej. al volver a hacer scroll) no debe apagarlo
    enterViewport(first);
    expect(isNodeActive(first)).toBe(true);
  });

  it("ilumina todos los nodos de inmediato con prefers-reduced-motion", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

    renderSection();
    const items = screen.getAllByRole("listitem").slice(0, 5);
    items.forEach((item) => expect(isNodeActive(item)).toBe(true));
  });

  it("mueve el foco al bloque de continuidad al activar el CTA", () => {
    renderSection();
    const cta = screen.getByRole("link", {
      name: /Servicio Administrativo y Personalizado/i,
    });
    const target = document.getElementById("servicio-administrativo")!;
    target.scrollIntoView = vi.fn();

    act(() => {
      cta.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(target.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(target);
    expect(target).toHaveAttribute("tabindex", "-1");
  });
});
