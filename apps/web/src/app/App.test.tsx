import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App shell", () => {
  it("renders the core navigation from the approved PRD", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: "Inventory" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sales Log" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import Review" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("toggles dark mode from the settings view", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(screen.getByRole("switch", { name: "Dark mode" }));

    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("shows the inventory summary metrics and primary table actions", () => {
    render(<App />);

    expect(screen.getByText("Active Lots")).toBeInTheDocument();
    expect(screen.getByText("Total Copies")).toBeInTheDocument();
    expect(screen.getByText("Bought Cost")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Card" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh Prices" })).toBeInTheDocument();
  });
});
