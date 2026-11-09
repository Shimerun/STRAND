export function assetUrl(path) {
  if (!path || /^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('data:')) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
