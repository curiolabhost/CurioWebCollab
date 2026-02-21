// scripts/ignoreAssetsLoader.mjs
// Node ESM loader that stubs CSS and asset imports so Node
// can import TSX modules without crashing.

const ASSET_REGEX =
  /\.(css|scss|sass|less|styl|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|eot)$/i;

export async function resolve(specifier, context, nextResolve) {
  // If someone imports a CSS module or asset, redirect to a virtual empty module
  if (ASSET_REGEX.test(specifier)) {
    return {
      url: `data:text/javascript,export default {}; export const __esModule = true;`,
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith("data:text/javascript,")) {
    return {
      format: "module",
      source: decodeURIComponent(
        url.slice("data:text/javascript,".length)
      ),
      shortCircuit: true,
    };
  }

  return nextLoad(url, context);
}