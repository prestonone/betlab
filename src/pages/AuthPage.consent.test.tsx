import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthPage from "./AuthPage";
import { AuthProvider } from "../contexts/AuthContext";

vi.mock("../services/subscriptions", () => ({
  getPlans: vi.fn().mockResolvedValue([]),
  setBillingCountry: vi.fn(),
}));

vi.mock("../services/auth", async () => {
  const actual = await vi.importActual<typeof import("../services/auth")>("../services/auth");
  return {
    ...actual,
    register: vi.fn().mockRejectedValue(new Error("Unable to connect to Bet Lab. Please confirm the backend is running.")),
  };
});

function renderRegister() {
  return render(
    <AuthProvider>
      <AuthPage mode="register" nav={() => {}} />
    </AuthProvider>,
  );
}

async function goToStep2(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/your full name/i), "Test Member");
  await user.type(screen.getByPlaceholderText(/you@example.com/i), "test-member@example.com");
  await user.type(screen.getByPlaceholderText("••••••••"), "a-strong-password-123");
  await user.click(screen.getByRole("button", { name: /continue/i }));
  await waitFor(() => expect(screen.getByText(/select your plan/i)).toBeInTheDocument());
}

describe("AuthPage registration consent", () => {
  it("renders exactly one combined mandatory checkbox plus refund and marketing checkboxes, all unticked", async () => {
    const user = userEvent.setup();
    renderRegister();
    await goToStep2(user);

    // consent-all (combined mandatory) + consent-refund + consent-marketing
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    for (const box of checkboxes) {
      expect(box).not.toBeChecked();
    }
  });

  it("blocks free registration until the combined mandatory consent is given", async () => {
    const user = userEvent.setup();
    renderRegister();
    await goToStep2(user);

    await user.click(screen.getByRole("button", { name: /continue for free instead/i }));

    expect(
      await screen.findByText(/accept the terms, privacy policy, and risk disclosure/i),
    ).toBeInTheDocument();
  });

  it("recording one checkbox accepts terms, privacy and age/risk together, and does not require marketing consent", async () => {
    const user = userEvent.setup();
    renderRegister();
    await goToStep2(user);

    await user.click(screen.getByLabelText(/terms of service/i, { selector: "input" }));
    // Marketing checkbox deliberately left unchecked.

    await user.click(screen.getByRole("button", { name: /continue for free instead/i }));

    // Past the consent gate, it attempts a real network call (no backend running in
    // tests) and surfaces a connection error instead of the consent-validation error.
    expect(
      await screen.findByText(/unable to connect to bet lab/i),
    ).toBeInTheDocument();
  });

  it("policy links open in a new tab instead of navigating away and losing form data", async () => {
    const user = userEvent.setup();
    renderRegister();
    await goToStep2(user);

    const termsLink = screen.getByRole("link", { name: "Terms of Service" });
    expect(termsLink).toHaveAttribute("target", "_blank");
    expect(termsLink).toHaveAttribute("href", "/legal/terms-of-service");

    const disclaimerLink = screen.getByRole("link", { name: "Disclaimer and Risk Disclosure" });
    expect(disclaimerLink).toHaveAttribute("href", "/legal/disclaimer");
  });
});
