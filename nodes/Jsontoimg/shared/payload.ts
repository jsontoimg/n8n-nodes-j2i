import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export const templateLocator = (show: {
	resource: string[];
	operation: string[];
}): INodeProperties => ({
	displayName: 'Template',
	name: 'templateId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description: 'Template to use',
	displayOptions: { show },
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a template...',
			typeOptions: {
				searchListMethod: 'getTemplates',
				searchable: true,
			},
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 0f1a2b3c-4d5e-6789-abcd-ef0123456789',
		},
	],
});

export function payloadJsonField(show: {
	resource: string[];
	operation: string[];
}): INodeProperties {
	return {
		displayName: 'Payload',
		name: 'payload',
		type: 'json',
		default: '{}',
		description:
			'JSON to merge into the request (format, layers, variables, scale, wait, webhookUrl, expiresIn, and other API fields). Template is taken from the Template field.',
		displayOptions: { show },
		typeOptions: {
			rows: 8,
		},
	};
}

export function parseJsonObject(
	this: IExecuteFunctions,
	value: unknown,
	field: string,
	itemIndex: number,
): IDataObject | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	let parsed: unknown = value;
	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (!trimmed) return undefined;
		try {
			parsed = JSON.parse(trimmed);
		} catch {
			throw new NodeOperationError(this.getNode(), `${field} must be valid JSON`, { itemIndex });
		}
	}
	if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new NodeOperationError(this.getNode(), `${field} must be a JSON object`, { itemIndex });
	}
	return parsed as IDataObject;
}

export function parseJsonArray(
	this: IExecuteFunctions,
	value: unknown,
	field: string,
	itemIndex: number,
): IDataObject[] {
	let parsed: unknown = value;
	if (typeof value === 'string') {
		try {
			parsed = JSON.parse(value);
		} catch {
			throw new NodeOperationError(this.getNode(), `${field} must be valid JSON`, { itemIndex });
		}
	}
	if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 50) {
		throw new NodeOperationError(this.getNode(), `${field} must be an array of 1 to 50 items`, {
			itemIndex,
		});
	}
	return parsed as IDataObject[];
}

export function buildTemplatePayload(
	this: IExecuteFunctions,
	i: number,
): { body: IDataObject; wait?: number } {
	const template = this.getNodeParameter('templateId', i, '', { extractValue: true }) as string;
	if (!template) {
		throw new NodeOperationError(this.getNode(), 'Template ID is required', { itemIndex: i });
	}

	const extra =
		parseJsonObject.call(this, this.getNodeParameter('payload', i, {}), 'Payload', i) ?? {};
	const wait = typeof extra.wait === 'number' ? extra.wait : undefined;
	const rest = { ...extra };
	delete rest.wait;
	delete rest.template;

	return {
		body: { ...rest, template },
		wait,
	};
}

export function waitTimeoutMs(seconds: number): number {
	return (seconds + 10) * 1000;
}
