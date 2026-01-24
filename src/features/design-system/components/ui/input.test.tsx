import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Input } from "./input"

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input placeholder="Ticker" />)
    expect(screen.getByPlaceholderText("Ticker")).toBeInTheDocument()
  })
})
