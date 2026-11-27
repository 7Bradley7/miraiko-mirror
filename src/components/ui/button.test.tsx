import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import { Button, ButtonLink } from "./button";

describe("Button", () => {
  it("is a real button that does not submit forms by default", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button");
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not react when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies the style of each variant", () => {
    render(
      <>
        <Button>Primary</Button>
        <Button variant="red">Red</Button>
        <Button variant="glass">Glass</Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "Primary" })).toHaveClass("bg-white");
    expect(screen.getByRole("button", { name: "Red" })).toHaveClass("bg-red");
    expect(screen.getByRole("button", { name: "Glass" })).toHaveClass("backdrop-blur-[6px]");
  });
});

describe("ButtonLink", () => {
  it("is a link in the current language, styled as a button", () => {
    renderWithIntl(
      <ButtonLink href="/sign-in" variant="red">
        Log in
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "Log in" });
    expect(link).toHaveAttribute("href", "/en/sign-in");
    expect(link).toHaveClass("bg-red");
  });
});
