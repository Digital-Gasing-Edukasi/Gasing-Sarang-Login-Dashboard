// Resolve current boot path: strip Vite BASE_URL prefix so routing/deep-link
// checks work both locally and when deployed under a sub-path.
export function resolveBootPath() {
  const params = new URLSearchParams(window.location.search);
  const base = import.meta.env.BASE_URL;
  let pathname = window.location.pathname;
  if (base !== "/" && pathname.startsWith(base)) {
    pathname = pathname.slice(base.length);
    if (!pathname.startsWith("/")) pathname = "/" + pathname;
  }
  return { params, pathname };
}
