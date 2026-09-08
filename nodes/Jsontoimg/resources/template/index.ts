import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { templateLocator } from '../../shared/payload';
import { jsontoimgApiRequest } from '../../shared/transport';

const showTemplate = { resource: ['template'] };

type TemplateList = {
	templates: IDataObject[];
	hasMore?: boolean;
};

export const templateDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showTemplate },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many templates',
				description: 'List templates in the workspace',
			},
			{
				name: 'Get Schema',
				value: 'getSchema',
				action: 'Get template schema',
				description: 'Get named layers and attribute schemas for a template version',
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: { ...showTemplate, operation: ['getAll'] },
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: { ...showTemplate, operation: ['getAll'], returnAll: [false] },
		},
	},
	{
		displayName: 'Project ID',
		name: 'project',
		type: 'string',
		default: '',
		description: 'Filter templates by project ID',
		displayOptions: {
			show: { ...showTemplate, operation: ['getAll'] },
		},
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		typeOptions: { minValue: 0 },
		default: 0,
		description: 'Number of templates to skip (ignored when Return All is on)',
		displayOptions: {
			show: { ...showTemplate, operation: ['getAll'], returnAll: [false] },
		},
	},
	templateLocator({ resource: ['template'], operation: ['getSchema'] }),
	{
		displayName: 'Version',
		name: 'version',
		type: 'number',
		typeOptions: { minValue: 0 },
		default: 0,
		description: 'Pin a design version. 0 uses the latest version.',
		displayOptions: {
			show: { ...showTemplate, operation: ['getSchema'] },
		},
	},
];

async function listPage(ctx: IExecuteFunctions, qs: IDataObject): Promise<TemplateList> {
	return (await jsontoimgApiRequest.call(ctx, 'GET', '/templates', { qs })) as TemplateList;
}

export async function executeTemplate(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData | INodeExecutionData[]> {
	if (operation === 'getAll') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const projectRaw = this.getNodeParameter('project', i, '') as string;
		const project = projectRaw ? projectRaw : undefined;
		const templates: IDataObject[] = [];

		if (returnAll) {
			let offset = 0;
			const limit = 100;
			for (;;) {
				const qs: IDataObject = { limit, offset };
				if (project) qs.project = project;
				const page = await listPage(this, qs);
				const batch = Array.isArray(page.templates) ? page.templates : [];
				templates.push(...batch);
				if (!page.hasMore || batch.length === 0) break;
				offset += batch.length;
			}
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			const offset = this.getNodeParameter('offset', i, 0) as number;
			const qs: IDataObject = { limit, offset };
			if (project) qs.project = project;
			const page = await listPage(this, qs);
			templates.push(...(Array.isArray(page.templates) ? page.templates : []));
		}

		return templates.map((json) => ({ json, pairedItem: { item: i } }));
	}

	const template = this.getNodeParameter('templateId', i, '', { extractValue: true }) as string;
	const version = this.getNodeParameter('version', i, 0) as number;
	const qs: IDataObject = {};
	if (version > 0) qs.version = version;
	const json = (await jsontoimgApiRequest.call(this, 'GET', `/templates/${template}/schema`, {
		qs: Object.keys(qs).length ? qs : undefined,
	})) as IDataObject;
	return { json, pairedItem: { item: i } };
}
