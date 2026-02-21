// scripts/registerAssetStubs.cjs
// Stubs out non-JS imports when TS/TSX modules get required in Node.

const NOOP = () => null;

const exts = [
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".styl",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
];

for (const ext of exts) {
  require.extensions[ext] = NOOP;
}

// Some bundlers generate querystrings like ".css?inline" — require() can't load that anyway,
// but if you run into weird cases, we can add more handling later.