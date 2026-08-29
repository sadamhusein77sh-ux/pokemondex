export function extractIdFromUrl(url: string | null | undefined): number | null {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const segments = trimmed.split('/').filter((segment) => segment.length > 0);
  const last = segments[segments.length - 1];
  if (last === undefined) {
    return null;
  }

  const parsed = Number.parseInt(last, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
