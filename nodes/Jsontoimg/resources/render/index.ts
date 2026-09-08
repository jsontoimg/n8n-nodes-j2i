import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { buildTemplatePayload, payloadJsonField, templateLocator, waitTimeoutMs } from '../../shared/payload';
import { extensionForMime, previewMime, toBuffer } from '../../shared/signedImage';
import {
	getApiOrigin,
	headerValue,
	jsontoimgApiRequest,
	responseStatus,
} from '../../shared/transport';

const showRender = { resource: ['render'] };

export const renderDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showRender },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a render',
				description: 'Queue a render job for a template',
			},
			{
				name: 'Download Asset',
				value: 'downloadAsset',
				action: 'Download a render asset',
				description: 'Download the image bytes for a completed render',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a render',
				description: 'Get the current status of a render job',
			},
			{
				name: 'Get Asset URL',
				value: 'getAssetUrl',
				action: 'Get a render asset URL',
				description: 'Return the asset URL for a render',
			},
			{
				name: 'Wait',
				value: 'wait',
				action: 'Wait for a render',
				description: 'Block until a render completes or times out',
			},
		],
		default: 'create',
	},
	templateLocator({ resource: ['render'], operation: ['create'] }),
	payloadJsonField({ resource: ['render'], operation: ['create'] }),
	{
		displayName: 'Render ID',
		name: 'renderId',
		type: 'string',
		required: true,
		default: '',
		description: 'Render job ID',
		displayOptions: {
			show: {
				...showRender,
				operation: ['wait', 'get', 'getAssetUrl', 'downloadAsset'],
			},
		},
	},
	{
		displayName: 'Timeout',
		name: 'timeout',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 60 },
		default: 30,
		description: 'Seconds to wait (default 30, max 60)',
		displayOptions: {
			show: { ...showRender, operation: ['wait'] },
		},
	},
];

export async function executeRender(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData> {
	if (operation === 'create') {
		const { body, wait } = buildTemplatePayload.call(this, i);
		const qs: IDataObject = wait != null ? { wait } : { async: 1 };
		const json = (await jsontoimgApiRequest.call(this, 'POST', '/render', {
			qs,
			body,
			timeout: waitTimeoutMs(wait ?? 5),
		})) as IDataObject;
		return { json, pairedItem: { item: i } };
	}

	const renderId = this.getNodeParameter('renderId', i) as string;
	if (!renderId) {
		throw new NodeOperationError(this.getNode(), 'Render ID is required', { itemIndex: i });
	}

	if (operation === 'wait') {
		const timeout = this.getNodeParameter('timeout', i, 30) as number;
		const json = (await jsontoimgApiRequest.call(this, 'GET', `/renders/${renderId}/wait`, {
			qs: { timeout },
			timeout: waitTimeoutMs(timeout),
		})) as IDataObject;
		return { json, pairedItem: { item: i } };
	}

	if (operation === 'get') {
		const json = (await jsontoimgApiRequest.call(
			this,
			'GET',
			`/renders/${renderId}`,
		)) as IDataObject;
		return { json, pairedItem: { item: i } };
	}

	if (operation === 'getAssetUrl') {
		const origin = await getApiOrigin.call(this);
		return {
			json: {
				assetUrl: `${origin}/api/v1/renders/${renderId}/asset`,
				note: 'Prefer assetUrl from Get when present (?sig= works in <img> with no key). This path also accepts Authorization: Bearer <API key>.',
			},
			pairedItem: { item: i },
		};
	}

	const response = (await jsontoimgApiRequest.call(this, 'GET', `/renders/${renderId}/asset`, {
		json: false,
		encoding: 'arraybuffer',
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	})) as IDataObject;

	const status = responseStatus(response);
	const contentType = headerValue(response.headers as IDataObject | undefined, 'content-type') ?? null;
	const body = toBuffer(response.body);

	if (!body) {
		throw new NodeApiError(
			this.getNode(),
			{ message: 'Empty render asset body' },
			{ itemIndex: i },
		);
	}

	if (status >= 400) {
		const message = body.toString('utf8') || `API ${status}`;
		throw new NodeApiError(this.getNode(), { message, httpCode: String(status) }, { itemIndex: i });
	}

	const mime = previewMime(contentType) ?? contentType;
	const ext = extensionForMime(typeof mime === 'string' ? mime : contentType);
	const binary = await this.helpers.prepareBinaryData(
		body,
		`render-${renderId}.${ext}`,
		typeof mime === 'string' && mime !== 'pdf' ? mime : (contentType ?? undefined),
	);

	return {
		json: { renderId, contentType: mime ?? contentType },
		binary: { data: binary },
		pairedItem: { item: i },
	};
}
