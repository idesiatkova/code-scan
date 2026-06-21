const fs = require("node:fs");
const path = require("node:path");

const { ensureVerified } = require("fallow/scripts/lazy-verify.js");

function resolveFallowBinary(packageRoot) {
  const scopePath = resolveFallowCliScopePath(packageRoot);
  const packageNames = installedPackageNames(scopePath);
  const selectedName = preferredPackageName(packageNames);

  if (!selectedName) {
    throw new Error("Fallow platform binary is not installed. Run npm install.");
  }

  const packageName = `@fallow-cli/${selectedName}`;
  const packagePath = path.join(scopePath, selectedName);
  const manifestPath = path.join(packagePath, "package.json");
  const binaryPath = path.join(packagePath, process.platform === "win32" ? "fallow.exe" : "fallow");

  verifyBinary(packageName, packagePath, manifestPath, binaryPath);
  return binaryPath;
}

function resolveFallowCliScopePath(packageRoot) {
  const fallowManifestPath = require.resolve("fallow/package.json", {
    paths: [packageRoot]
  });
  const nodeModulesRoot = path.dirname(path.dirname(fallowManifestPath));
  return path.join(nodeModulesRoot, "@fallow-cli");
}

function installedPackageNames(scopePath) {
  try {
    return fs.readdirSync(scopePath).filter((name) => {
      return fs.existsSync(path.join(scopePath, name, "package.json"));
    });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function preferredPackageName(packageNames) {
  const platformNames = packageNames.filter((name) => name.startsWith(`${process.platform}-`));
  const exactName = platformNames.find((name) => name.includes(`-${process.arch}`));
  return exactName || platformNames[0] || null;
}

function verifyBinary(packageName, packagePath, manifestPath, binaryPath) {
  if (!fs.existsSync(binaryPath)) {
    throw new Error(`Fallow binary is missing at ${binaryPath}. Run npm install.`);
  }

  const result = ensureVerified({
    manifestPath,
    packageName,
    platformPkgDir: packagePath
  });
  if (!result.ok) {
    throw new Error(`Fallow binary verification failed: ${result.message}`);
  }
}

module.exports = {
  preferredPackageName,
  resolveFallowCliScopePath,
  resolveFallowBinary
};
