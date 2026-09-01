/**
 * Display-time rebranding for text that arrives from the published extension
 * catalogs (`@openhands/extensions`).
 *
 * Those catalogs are third-party data shipped in `node_modules`: their
 * automation names, descriptions, and skill blurbs still carry the upstream
 * product name, and patching the package would be undone by the next install.
 * So the host rebrands at the point of display instead.
 *
 * Only prose is rewritten. Anything the string needs to keep working — a
 * `github:owner/repo` reference, a branch prefix such as `openhands/issue-42`,
 * a package name, a URL, or a GitHub handle — is left exactly as published,
 * because those identify real remote things rather than naming the product.
 */

const PRODUCT_NAME = "AUTO/MATE";

/** Functional identifiers that must survive verbatim. */
const PRESERVED =
  /(@openhands\/[\w.-]+|openhands\/[\w.-]+|openhands-[\w.-]+|openhands\.dev|all-hands\.dev|OpenHands\/[\w.-]+|github:[\w.-]+\/[\w.-]+)/g;

const BRAND = /@?Open\s?Hands|@?openhands|@?OPENHANDS/g;

/**
 * Rewrite the product name in a catalog string, leaving preserved identifiers
 * untouched. Returns the input unchanged when it mentions no brand at all,
 * so the common case allocates nothing.
 */
export function rebrandCatalogText<T extends string | undefined | null>(
  value: T,
): T {
  if (!value || !BRAND.test(value)) {
    BRAND.lastIndex = 0;
    return value;
  }
  BRAND.lastIndex = 0;

  let out = "";
  let last = 0;
  PRESERVED.lastIndex = 0;
  for (const match of value.matchAll(PRESERVED)) {
    out += value.slice(last, match.index).replace(BRAND, PRODUCT_NAME);
    out += match[0];
    last = match.index + match[0].length;
  }
  out += value.slice(last).replace(BRAND, PRODUCT_NAME);
  return out as T;
}
