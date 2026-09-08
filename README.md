# @j2i/n8n-nodes-j2i

n8n community node for [jsontoimg](https://jsontoimg.com). Render templates to PNG, JPG, WebP, AVIF, or PDF from n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

Package name: `@j2i/n8n-nodes-j2i`

## Operations

- Template
	- Get many templates
	- Get template schema
- Render
	- Create a render (optional wait)
	- Wait for a render
	- Get a render
	- Get a render asset URL
	- Download a render asset (binary)
- Batch
	- Create a batch (up to 50 jobs)
	- Get a batch
- Signed Image
	- Sign an image URL
	- Sign many image URLs
	- Download a signed image (binary; no API key on the GET; retries 503)

## Credentials

Use a jsontoimg API key.

1. Create a key under [Integrations → API keys](https://app.jsontoimg.com/integrations/api-keys).
2. In n8n, add **jsontoimg API** credentials.
3. Paste the key. Leave Base URL as `https://app.jsontoimg.com` unless you self-host.

Requests send `Authorization: Bearer <key>` to `/api/v1`. Signed image downloads do not send the key.

## Compatibility

Compatible with n8n@1.60.0 or later.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [jsontoimg n8n docs](https://docs.jsontoimg.com/docs/integrations/n8n)
- [jsontoimg API reference](https://docs.jsontoimg.com/docs/api)
