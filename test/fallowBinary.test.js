const assert = require("node:assert/strict");
const test = require("node:test");

const {
  preferredPackageName,
  resolveFallowBinary,
  resolveFallowCliScopePath
} = require("../src/fallowBinary");
const { PACKAGE_ROOT } = require("../src/paths");

test("prefers the installed package matching the current Node architecture", () => {
  const names = [`${process.platform}-other`, `${process.platform}-${process.arch}`];
  assert.equal(preferredPackageName(names), `${process.platform}-${process.arch}`);
});

test("falls back to another installed package for the current platform", () => {
  assert.equal(preferredPackageName(["darwin-arm64"]), process.platform === "darwin" ? "darwin-arm64" : null);
});

test("resolves an installed verified Fallow binary", () => {
  assert.match(resolveFallowBinary(PACKAGE_ROOT), /@fallow-cli.+fallow(?:\.exe)?$/);
});

test("resolves Fallow platform packages from package dependencies", () => {
  assert.match(resolveFallowCliScopePath(PACKAGE_ROOT), /node_modules[/\\]@fallow-cli$/);
});
