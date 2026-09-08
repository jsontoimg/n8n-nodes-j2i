import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import {
	buildTemplatePayload,
	parseJsonArray,
	payloadJsonField,
	templateLocator,
	waitTimeoutMs,
} from '../../shared/payload';
import {
	extensionForMime,
	fetchSignedImageWithRetry,
	previewMime,
	rewriteSignedImgUrl,
	toBuffer,
} from '../../shared/signedImage';
import {
	getApiOrigin,
	headerValue,
	jsontoimgApiRequest,
	jsontoimgPublicRequest,
	responseStatus,
} from '../../shared/transport';

const showSigned = { resource: ['signedImage'] };

export const signedImageDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showSigned },
		options: [
			{
				name: 'Download',
				value: 'download',
				action: 'Download a signed image',
				description: 'Fetch a signed image URL (no API key; retries 503)',
			},
			{
				name: 'Sign',
				value: 'sign',
				action: 'Sign an image url',
				description: 'Mint a signed GET /api/v1/img/{template} URL',
			},
			{
				name: 'Sign Many',
				value: 'signMany',
				action: 'Sign many image urls',
				description: 'Mint up to 50 signed image URLs in one call',
			},
		],
		default: 'sign',
	},
	templateLocator({ resource: ['signedImage'], operation: ['sign'] }),
	payloadJsonField({ resource: ['signedImage'], operation: ['sign'] }),
	{
		displayName: 'Jobs',
		name: 'jobs',
		type: 'json',
		required: true,
		default: '[]',
		description: 'Array of 1 to 50 sign payloads',
		displayOptions: {
			show: { ...showSigned, operation: ['signMany'] },
		},
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		description: 'Signed URL from Sign',
		displayOptions: {
			show: { ...showSigned, operation: ['download'] },
		},
	},
	{
		displayName: 'Timeout',
		name: 'timeout',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 60 },
		default: 30,
		description: 'Seconds to wait on 503 (default 30, max 60)',
		displayOptions: {
			show: { ...showSigned, operation: ['download'] },
		},
	},
];

export async function executeSignedImage(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData> {
	if (operation === 'sign') {
		const { body } = buildTemplatePayload.call(this, i);
		const json = (await jsontoimgApiRequest.call(this, 'POST', '/img/sign', {
			body,
		})) as IDataObject;
		return { json, pairedItem: { item: i } };
	}

	if (operation === 'signMany') {
		const jobs = parseJsonArray.call(this, this.getNodeParameter('jobs', i), 'Jobs', i);
		const json = (await jsontoimgApiRequest.call(this, 'POST', '/img/sign', {
			body: { jobs },
		})) as IDataObject;
		return { json, pairedItem: { item: i } };
	}

	const url = this.getNodeParameter('url', i) as string;
	const timeout = this.getNodeParameter('timeout', i, 30) as number;
	const origin = await getApiOrigin.call(this);
	const fetchUrl = rewriteSignedImgUrl(url, `${origin}/api/v1`);
	if (!fetchUrl) {
		throw new NodeOperationError(
			this.getNode(),
			'url must be a signed /api/v1/img/{templateId} URL',
			{ itemIndex: i },
		);
	}

	const result = await fetchSignedImageWithRetry(timeout, async () => {
		const response = (await jsontoimgPublicRequest.call(this, {
			method: 'GET',
			url: fetchUrl,
			json: false,
			encoding: 'arraybuffer',
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
			timeout: waitTimeoutMs(timeout),
			headers: {},
		})) as IDataObject;
		const headers = (response.headers as IDataObject) ?? {};
		const retryAfterRaw = headerValue(headers, 'retry-after');
		const body = toBuffer(response.body);
		if (!body) {
			throw new NodeApiError(
				this.getNode(),
				{ message: 'Empty signed image body' },
				{ itemIndex: i },
			);
		}
		return {
			status: responseStatus(response),
			contentType: headerValue(headers, 'content-type') ?? null,
			body,
			retryAfter: retryAfterRaw ? Number(retryAfterRaw) : undefined,
		};
	});

	if (!result) {
		throw new NodeApiError(
			this.getNode(),
			{ message: `API fetch failed ${fetchUrl}: timed out` },
			{ itemIndex: i },
		);
	}

	if (result.status >= 400) {
		const message = result.body.toString('utf8') || `API ${result.status}`;
		throw new NodeApiError(
			this.getNode(),
			{ message, httpCode: String(result.status) },
			{ itemIndex: i },
		);
	}

	const mime = previewMime(result.contentType);
	if (mime === 'pdf') {
		return {
			json: {
				url,
				contentType: result.contentType,
				note: 'PDF is not previewable as image binary; open url',
			},
			pairedItem: { item: i },
		};
	}
	if (!mime) {
		return {
			json: {
				url,
				contentType: result.contentType,
				note: 'Response was not an image or PDF',
			},
			pairedItem: { item: i },
		};
	}

	const ext = extensionForMime(mime);
	const binary = await this.helpers.prepareBinaryData(result.body, `signed.${ext}`, mime);
	return {
		json: { url, contentType: mime },
		binary: { data: binary },
		pairedItem: { item: i },
	};
}
