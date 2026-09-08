import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { parseJsonArray } from '../../shared/payload';
import { jsontoimgApiRequest } from '../../shared/transport';

const showBatch = { resource: ['batch'] };

export const batchDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showBatch },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a batch',
				description: 'Queue up to 50 async renders in one batch',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a batch',
				description: 'Get batch status and child render jobs',
			},
		],
		default: 'create',
	},
	{
		displayName: 'Jobs',
		name: 'jobs',
		type: 'json',
		required: true,
		default: '[]',
		description: 'Array of 1 to 50 render payloads',
		displayOptions: {
			show: { ...showBatch, operation: ['create'] },
		},
	},
	{
		displayName: 'Batch ID',
		name: 'batchId',
		type: 'string',
		required: true,
		default: '',
		description: 'Batch ID from Create',
		displayOptions: {
			show: { ...showBatch, operation: ['get'] },
		},
	},
];

export async function executeBatch(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData> {
	if (operation === 'create') {
		const jobs = parseJsonArray.call(this, this.getNodeParameter('jobs', i), 'Jobs', i);
		const json = (await jsontoimgApiRequest.call(this, 'POST', '/renders/batch', {
			body: { jobs },
		})) as IDataObject;
		return { json, pairedItem: { item: i } };
	}

	const batchId = this.getNodeParameter('batchId', i) as string;
	if (!batchId) {
		throw new NodeOperationError(this.getNode(), 'Batch ID is required', { itemIndex: i });
	}
	const json = (await jsontoimgApiRequest.call(
		this,
		'GET',
		`/renders/batches/${batchId}`,
	)) as IDataObject;
	return { json, pairedItem: { item: i } };
}
