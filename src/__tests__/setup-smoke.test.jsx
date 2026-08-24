import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// Smoke test: memastikan runner (jsdom + testing-library + jest-dom) hidup.
describe("vitest setup", () => {
  it("render komponen React ke jsdom", () => {
    render(<p>halo gasing</p>);
    expect(screen.getByText("halo gasing")).toBeInTheDocument();
  });
});
