import { describe, expect, it } from "vitest"

import { isHrefActive, normalizeAppPath, stripLocalePrefix } from "./path"

describe("normalizeAppPath", () => {
  it("adds a leading slash", () => {
    expect(normalizeAppPath("search")).toBe("/search")
  })

  it("removes trailing slashes", () => {
    expect(normalizeAppPath("/transactions/")).toBe("/transactions")
  })

  it("normalizes empty to root", () => {
    expect(normalizeAppPath("")).toBe("/")
  })
})

describe("stripLocalePrefix", () => {
  it("removes /en prefix", () => {
    expect(stripLocalePrefix("/en/search")).toBe("/search")
  })

  it("removes /pl prefix", () => {
    expect(stripLocalePrefix("/pl/transactions")).toBe("/transactions")
  })

  it("keeps root stable", () => {
    expect(stripLocalePrefix("/en")).toBe("/")
  })
})

describe("isHrefActive", () => {
  it("matches exact route", () => {
    expect(isHrefActive("/transactions", "/transactions")).toBe(true)
  })

  it("matches nested routes", () => {
    expect(isHrefActive("/transactions/new", "/transactions")).toBe(true)
  })

  it("does not match siblings", () => {
    expect(isHrefActive("/transactions-archive", "/transactions")).toBe(false)
  })

  it("treats root as exact match only", () => {
    expect(isHrefActive("/search", "/")).toBe(false)
    expect(isHrefActive("/", "/")).toBe(true)
  })
})

