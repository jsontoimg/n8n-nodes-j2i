import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class JsontoimgApi implements ICredentialType {
	name = 'jsontoimgApi';

	displayName = 'Jsontoimg API';

	icon: Icon = { light: 'file:../icons/logo.svg', dark: 'file:../icons/logo.dark.svg' };

	documentationUrl = 'https://docs.jsontoimg.com/docs/integrations/n8n';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://app.jsontoimg.com',
			placeholder: 'https://app.jsontoimg.com',
			description: 'API origin (trailing /api/v1 is stripped)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{String($credentials.baseUrl).replace(new RegExp("/$"), "").replace(new RegExp("/(api/v1|mcp)$"), "")}}',
			url: '/api/v1/templates',
			method: 'GET',
			qs: {
				limit: 1,
			},
		},
	};
}
