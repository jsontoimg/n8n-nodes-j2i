export const DEFAULT_BASE_URL = 'https://app.jsontoimg.com';

/** Strip trailing slash and optional /api/v1 or /mcp suffix. */
export function normalizeBaseUrl(raw: string): string {
	return raw.replace(/\/$/, '').replace(/\/(api\/v1|mcp)$/, '');
}
