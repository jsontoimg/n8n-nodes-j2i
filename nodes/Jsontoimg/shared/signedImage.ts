import { sleep } from 'n8n-workflow';

export const SIGNED_IMG_PATH = /^\/api\/v1\/img\/([^/]+)$/;

export const IMAGE_MIME = new Set([
	'image/png',
	'image/jpeg',
	'image/jpg',
	'image/webp',
	'image/avif',
]);

export type SignedImageGetResult = {
	status: number;
	contentType: string | null;
	body: Buffer;
	retryAfter?: number;
};

/** Ignore the signed URL host; fetch via apiUrl so the request stays on the configured origin. */
export function rewriteSignedImgUrl(signedUrl: string, apiUrl: string): string | null {
	let parsed: URL;
	try {
		parsed = new URL(signedUrl);
	} catch {
		return null;
	}
	const match = parsed.pathname.match(SIGNED_IMG_PATH);
	if (!match || !parsed.searchParams.get('sig')) {
		return null;
	}
	return `${apiUrl.replace(/\/$/, '')}/img/${match[1]}${parsed.search}`;
}

export function previewMime(contentType: string | null): 'pdf' | string | null {
	const mime = (contentType ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
	if (mime === 'application/pdf') return 'pdf';
	if (IMAGE_MIME.has(mime)) return mime === 'image/jpg' ? 'image/jpeg' : mime;
	return null;
}

export function extensionForMime(mime: string | null): string {
	if (mime === 'pdf' || mime === 'application/pdf') return 'pdf';
	if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
	if (mime === 'image/webp') return 'webp';
	if (mime === 'image/avif') return 'avif';
	if (mime === 'image/png') return 'png';
	return 'bin';
}

export function toBuffer(body: unknown): Buffer | null {
	if (Buffer.isBuffer(body)) return body;
	if (body instanceof ArrayBuffer) return Buffer.from(body);
	if (ArrayBuffer.isView(body)) {
		return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
	}
	if (typeof body === 'string') return Buffer.from(body);
	return null;
}

export async function fetchSignedImageWithRetry(
	timeoutSeconds: number,
	get: () => Promise<SignedImageGetResult>,
): Promise<SignedImageGetResult | null> {
	const deadline = Date.now() + timeoutSeconds * 1000;
	let last: SignedImageGetResult | undefined;
	while (Date.now() < deadline) {
		last = await get();
		if (last.status !== 503) {
			return last;
		}
		const remaining = deadline - Date.now();
		if (remaining <= 0) {
			return last;
		}
		const retryAfter = last.retryAfter;
		const waitMs = Math.min(
			Number.isFinite(retryAfter) && retryAfter && retryAfter > 0 ? retryAfter * 1000 : 2000,
			remaining,
		);
		await sleep(waitMs);
	}
	return last ?? null;
}
