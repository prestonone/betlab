import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConsentCheckbox from "./ConsentCheckbox";

describe("ConsentCheckbox", () => {
  it("starts unticked when checked=false is passed", () => {
    render(
      <ConsentCheckbox id="c1" checked={false} onChange={() => {}}>
        Accept terms
      </ConsentCheckbox>,
    );
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("calls onChange with the new value when clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ConsentCheckbox id="c2" checked={false} onChange={onChange}>
        Accept terms
      </ConsentCheckbox>,
    );
    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("is marked required by default", () => {
    render(
      <ConsentCheckbox id="c3" checked={false} onChange={() => {}}>
        Accept terms
      </ConsentCheckbox>,
    );
    expect(screen.getByRole("checkbox")).toBeRequired();
  });

  it("is not required when required=false, and shows an (optional) label", () => {
    render(
      <ConsentCheckbox id="c4" checked={false} onChange={() => {}} required={false}>
        Marketing emails
      </ConsentCheckbox>,
    );
    expect(screen.getByRole("checkbox")).not.toBeRequired();
    expect(screen.getByText(/optional/i)).toBeInTheDocument();
  });
});
