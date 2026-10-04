import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OverflowText } from "../components/OverflowText.jsx";

let restoreDims = null;

afterEach(() => {
  restoreDims?.();
  restoreDims = null;
});

// jsdom has no layout (all dims are 0): fake an overflowing or fitting box.
function mockDims(dims) {
  const proto = Element.prototype;
  const originals = {};
  for (const [key, val] of Object.entries(dims)) {
    originals[key] = Object.getOwnPropertyDescriptor(proto, key);
    Object.defineProperty(proto, key, { configurable: true, get: () => val });
  }
  restoreDims = () => {
    for (const [key, desc] of Object.entries(originals)) {
      if (desc) Object.defineProperty(proto, key, desc);
      else delete proto[key];
    }
  };
}

describe("OverflowText", () => {
  it("renders the value without tooltip when it fits", async () => {
    const user = userEvent.setup();
    render(<OverflowText value="01 Jan 2000" delayDuration={0} />);

    await user.hover(screen.getByText("01 Jan 2000"));

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows the full value on hover only when overflowing", async () => {
    mockDims({ scrollWidth: 300, clientWidth: 100, scrollHeight: 40, clientHeight: 40 });
    render(
      <OverflowText
        value="Kota Administrasi Jakarta Pusat Bagian Utara Sekali"
        delayDuration={0}
      />,
    );

    const user = userEvent.setup();
    await user.hover(
      screen.getByText("Kota Administrasi Jakarta Pusat Bagian Utara Sekali"),
    );

    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveTextContent("Kota Administrasi Jakarta Pusat Bagian Utara Sekali");
  });
});
