# @j2i/n8n-nodes-j2i

n8n community node for [jsontoimg](https://jsontoimg.com). Render templates to PNG, JPG, WebP, AVIF, or PDF from n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
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

## Usage

End-to-end: **Render → Create** a PNG and wait for the signed `assetUrl`.

1. Install the node and add **jsontoimg API** credentials (see [Credentials](#credentials)).
2. Add a **jsontoimg** node.
3. Set **Resource** to `Render` and **Operation** to `Create`.
4. Pick a **Template** from the list (or paste a template ID). Template is this field, not the Payload JSON.
5. Put format, layers, and `wait` in **Payload**:

```json
{
  "format": "png",
  "wait": 60,
  "layers": {
    "headline": { "text": "{{ $json.title }}" },
    "photo": { "image_url": "{{ $json.imageUrl }}" }
  }
}
```

Layer names must match the design. Use **Template → Get Schema** first if you are unsure.

**Expected output** when `wait` is set and the job finishes:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "done",
  "format": "png",
  "attempts": 1,
  "error": null,
  "assetUrl": "https://app.jsontoimg.com/api/v1/renders/550e8400-e29b-41d4-a716-446655440000/asset?sig=…"
}
```

`assetUrl` includes `?sig=` so it works in `<img>` with no API key. Use **Download Asset** with the render `id` when the next node needs binary (Gmail, Drive, Slack).

Without `wait`, Create queues the job (`status: "queued"`). Follow with **Wait**, **Get**, or a webhook.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [jsontoimg n8n docs](https://docs.jsontoimg.com/docs/integrations/n8n)
- [jsontoimg API reference](https://docs.jsontoimg.com/docs/api)
