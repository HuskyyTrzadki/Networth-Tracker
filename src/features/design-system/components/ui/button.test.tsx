import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "./button"

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })

  it("defaults to type=button", () => {
    render(<Button>Action</Button>)
    expect(screen.getByRole("button", { name: "Action" })).toHaveAttribute(
      "type",
      "button"
    )
  })

  it("respects explicit type", () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole("button", { name: "Submit" })).toHaveAttribute(
      "type",
      "submit"
    )
  })
})
