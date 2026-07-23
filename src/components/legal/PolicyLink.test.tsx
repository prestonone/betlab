import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PolicyLink from "./PolicyLink";

describe("PolicyLink", () => {
  it("resolves to the canonical /legal/:slug route", () => {
    render(<PolicyLink slug="privacy">Privacy Policy</PolicyLink>);
    const link = screen.getByRole("link", { name: "Privacy Policy" });
    expect(link).toHaveAttribute("href", "/legal/privacy");
  });

  it("opens in a new tab so it never disturbs the current page's form state", () => {
    render(<PolicyLink slug="terms-of-service">Terms of Service</PolicyLink>);
    const link = screen.getByRole("link", { name: "Terms of Service" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
