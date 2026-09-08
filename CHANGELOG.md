# Changelog

All notable changes to `@j2i/n8n-nodes-j2i` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Node `typeVersion` is `1` (see `.agents/versioning.md`). Package versions below are npm releases, not n8n light/full node versions.

## [1.0.0] - Unreleased

First public release on the [n8n community nodes](https://docs.n8n.io/integrations/community-nodes/) registry.

### Added

- Publish `@j2i/n8n-nodes-j2i` to n8n community-nodes (npm provenance via GitHub Actions).

## [0.1.0] - 2026-09-08

Initial jsontoimg community node (`typeVersion` 1).

### Added

- **jsontoimg** node with resources Template, Render, Batch, and Signed Image.
- **Credentials:** jsontoimg API (Bearer API key, configurable Base URL, credential test against `/api/v1/templates`).
- **Template**
  - Get Many (limit/offset, return all, optional project filter)
  - Get Schema (optional design version pin)
- **Render**
  - Create (queue a job; optional `wait` in the payload JSON)
  - Wait (block until complete or timeout, max 60s)
  - Get
  - Get Asset URL
  - Download Asset (binary)
- **Batch**
  - Create (1–50 jobs)
  - Get
- **Signed Image**
  - Sign a GET `/api/v1/img/{template}` URL
  - Sign Many (1–50 URLs)
  - Download (no API key on GET; retries HTTP 503)
- Template resource locator (searchable list or ID).
- Payload JSON field for format, layers, variables, scale, webhook, and other API fields.
- `usableAsTool` so the node can be used as an AI tool.
- Compatible with n8n 1.60.0 or later.
