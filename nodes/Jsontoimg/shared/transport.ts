import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';
import { DEFAULT_BASE_URL, normalizeBaseUrl } from './url';

type Ctx = IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions;

export async function getApiOrigin(this: Ctx): Promise<string> {
	const credentials = await this.getCredentials('jsontoimgApi');
	return normalizeBaseUrl(String(credentials.baseUrl || DEFAULT_BASE_URL));
}

export async function jsontoimgApiRequest(
	this: Ctx,
	method: IHttpRequestMethods,
	path: string,
	options: {
		qs?: IDataObject;
		body?: IDataObject;
		json?: boolean;
		encoding?: IHttpRequestOptions['encoding'];
		timeout?: number;
		returnFullResponse?: boolean;
		ignoreHttpStatusErrors?: boolean;
	} = {},
): Promise<unknown> {
	const origin = await getApiOrigin.call(this);
	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${origin}/api/v1${path}`,
		qs: options.qs,
		body: options.body,
		json: options.json ?? true,
		timeout: options.timeout,
		returnFullResponse: options.returnFullResponse,
		ignoreHttpStatusErrors: options.ignoreHttpStatusErrors,
	};
	if (options.encoding) {
		requestOptions.encoding = options.encoding;
	}
	return this.helpers.httpRequestWithAuthentication.call(this, 'jsontoimgApi', requestOptions);
}

export async function jsontoimgPublicRequest(
	this: IExecuteFunctions,
	options: IHttpRequestOptions,
): Promise<unknown> {
	return this.helpers.httpRequest(options);
}

export function headerValue(
	headers: IDataObject | undefined,
	name: string,
): string | undefined {
	if (!headers) return undefined;
	const lower = name.toLowerCase();
	for (const [key, value] of Object.entries(headers)) {
		if (key.toLowerCase() === lower) {
			return Array.isArray(value) ? String(value[0]) : value != null ? String(value) : undefined;
		}
	}
	return undefined;
}

export function responseStatus(response: IDataObject): number {
	const code = response.statusCode ?? response.status;
	return typeof code === 'number' ? code : Number(code);
}
