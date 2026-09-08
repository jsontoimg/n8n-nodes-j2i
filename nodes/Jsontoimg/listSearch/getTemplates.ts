import type {
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
} from 'n8n-workflow';
import { jsontoimgApiRequest } from '../shared/transport';

type TemplateListItem = {
	id: string;
	name: string;
	description?: string | null;
};

type TemplateList = {
	templates: TemplateListItem[];
	hasMore?: boolean;
	offset?: number;
};

export async function getTemplates(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const offset = paginationToken ? Number(paginationToken) : 0;
	const limit = 50;
	const response = (await jsontoimgApiRequest.call(this, 'GET', '/templates', {
		qs: { limit, offset },
	})) as TemplateList;

	const templates = Array.isArray(response.templates) ? response.templates : [];
	const needle = filter?.trim().toLowerCase();
	const matched = needle
		? templates.filter(
				(item) =>
					item.name.toLowerCase().includes(needle) ||
					item.id.toLowerCase().includes(needle) ||
					(item.description ?? '').toLowerCase().includes(needle),
			)
		: templates;

	const results: INodeListSearchItems[] = matched.map((item) => ({
		name: item.name,
		value: item.id,
		description: item.description ?? undefined,
	}));

	const nextOffset = offset + templates.length;
	return {
		results,
		paginationToken: response.hasMore ? String(nextOffset) : undefined,
	};
}
