import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';
import { getTemplates } from './listSearch/getTemplates';
import { batchDescription, executeBatch } from './resources/batch';
import { executeRender, renderDescription } from './resources/render';
import { executeSignedImage, signedImageDescription } from './resources/signedImage';
import { executeTemplate, templateDescription } from './resources/template';

export class Jsontoimg implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'jsontoimg',
		name: 'jsontoimg',
		icon: { light: 'file:../../icons/logo.svg', dark: 'file:../../icons/logo.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Render jsontoimg templates to images',
		defaults: {
			name: 'jsontoimg',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'jsontoimgApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Batch',
						value: 'batch',
					},
					{
						name: 'Render',
						value: 'render',
					},
					{
						name: 'Signed Image',
						value: 'signedImage',
					},
					{
						name: 'Template',
						value: 'template',
					},
				],
				default: 'render',
			},
			...templateDescription,
			...renderDescription,
			...batchDescription,
			...signedImageDescription,
		],
	};

	methods = {
		listSearch: {
			getTemplates,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let result: INodeExecutionData | INodeExecutionData[];
				if (resource === 'template') {
					result = await executeTemplate.call(this, operation, i);
				} else if (resource === 'render') {
					result = await executeRender.call(this, operation, i);
				} else if (resource === 'batch') {
					result = await executeBatch.call(this, operation, i);
				} else if (resource === 'signedImage') {
					result = await executeSignedImage.call(this, operation, i);
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
						itemIndex: i,
					});
				}

				if (Array.isArray(result)) {
					returnData.push(...result);
				} else {
					returnData.push(result);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
