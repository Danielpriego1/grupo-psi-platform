import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

// --- Mocks (hoisted so vi.mock factories can reference them) ---
const { navigateMock, signOutMock, toastSuccess, toastError, clearRememberMock } = vi.hoisted(
  () => ({
    navigateMock: vi.fn(),
    signOutMock: vi.fn().mockResolvedValue(undefined),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
    clearRememberMock: vi.fn(),
  }),
);

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-123", email: "u@test.com" },
    signOut: signOutMock,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

vi.mock("@/lib/authSession", () => ({
  clearRememberPreference: clearRememberMock,
}));

const supabaseMock = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    refreshSession: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
  },
  functions: { invoke: vi.fn() },
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

import ChangePassword from "../ChangePassword";

function renderPage() {
  return render(
    <MemoryRouter>
      <ChangePassword />
    </MemoryRouter>,
  );
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/contraseña actual/i), "OldPass123");
  await user.type(screen.getByLabelText(/^nueva contraseña$/i), "NewPass456");
  await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), "NewPass456");
  await user.click(screen.getByRole("button", { name: /actualizar contraseña/i }));
}

beforeEach(() => {
  vi.clearAllMocks();
  supabaseMock.functions.invoke.mockResolvedValue({ data: null, error: null });
  supabaseMock.auth.getSession.mockResolvedValue({
    data: { session: { access_token: "t" } },
    error: null,
  });
  supabaseMock.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-123", email: "u@test.com" } },
    error: null,
  });
  supabaseMock.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
  supabaseMock.auth.refreshSession.mockResolvedValue({ data: {}, error: null });
  supabaseMock.auth.updateUser.mockResolvedValue({ data: {}, error: null });
  supabaseMock.auth.signOut.mockResolvedValue({ error: null });
});

describe("ChangePassword flow (integration)", () => {
  it("ejecuta reautenticación, update, signOut global y redirige a /login", async () => {
    const user = userEvent.setup();
    renderPage();
    await fillAndSubmit(user);

    await waitFor(() => expect(supabaseMock.auth.updateUser).toHaveBeenCalled());

    // 1. Reautenticación con email verificado
    expect(supabaseMock.auth.getSession).toHaveBeenCalled();
    expect(supabaseMock.auth.getUser).toHaveBeenCalled();
    expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "u@test.com",
      password: "OldPass123",
    });

    // 2. Refresh + update
    expect(supabaseMock.auth.refreshSession).toHaveBeenCalled();
    expect(supabaseMock.auth.updateUser).toHaveBeenCalledWith({ password: "NewPass456" });

    // 3. signOut global
    await waitFor(() =>
      expect(supabaseMock.auth.signOut).toHaveBeenCalledWith({ scope: "global" }),
    );
    expect(clearRememberMock).toHaveBeenCalled();

    // 4. Redirect a /login
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true }),
    );
    expect(toastSuccess).toHaveBeenCalled();

    // Notificación email disparada
    expect(supabaseMock.functions.invoke).toHaveBeenCalledWith(
      "notify-password-change",
      expect.any(Object),
    );
  });

  it("aborta si la sesión expiró y redirige a /login", async () => {
    supabaseMock.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    const user = userEvent.setup();
    renderPage();
    await fillAndSubmit(user);

    await waitFor(() => expect(signOutMock).toHaveBeenCalled());
    expect(supabaseMock.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(supabaseMock.auth.updateUser).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true });
    expect(toastError).toHaveBeenCalled();
  });

  it("aborta si la contraseña actual es incorrecta", async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: "Invalid login credentials", code: "invalid_credentials" },
    });
    const user = userEvent.setup();
    renderPage();
    await fillAndSubmit(user);

    await waitFor(() =>
      expect(screen.getByText(/contraseña actual no es correcta/i)).toBeInTheDocument(),
    );
    expect(supabaseMock.auth.updateUser).not.toHaveBeenCalled();
    expect(supabaseMock.auth.signOut).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("cae a signOut local si signOut global falla", async () => {
    supabaseMock.auth.signOut.mockRejectedValueOnce(new Error("network"));
    const user = userEvent.setup();
    renderPage();
    await fillAndSubmit(user);

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true }));
    expect(supabaseMock.auth.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(signOutMock).toHaveBeenCalled();
    expect(clearRememberMock).toHaveBeenCalled();
  });

  it("confirma el cambio aunque la edge function de notificación falle", async () => {
    // La invocación a notify-password-change falla, pero NO debe bloquear el flujo.
    supabaseMock.functions.invoke.mockRejectedValueOnce(new Error("edge_down"));
    const user = userEvent.setup();
    renderPage();
    await fillAndSubmit(user);

    // Update sí ocurre
    await waitFor(() => expect(supabaseMock.auth.updateUser).toHaveBeenCalled());

    // signOut global + redirect + toast success igualmente
    await waitFor(() =>
      expect(supabaseMock.auth.signOut).toHaveBeenCalledWith({ scope: "global" }),
    );
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true }),
    );
    expect(toastSuccess).toHaveBeenCalled();
    // No se muestra error al usuario por el fallo del email
    expect(toastError).not.toHaveBeenCalled();
    expect(clearRememberMock).toHaveBeenCalled();
  });
});
