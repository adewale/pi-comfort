# pi-comfort

Personal comfort extensions and configuration experiments for [pi](https://pi.dev).

## Extensions

### `/export-to-browser [output.html]`

Opens the latest assistant response as a standalone, nicely styled HTML page in your browser.

Features:
- exports only the latest assistant text response
- skips tool-only assistant messages
- optional output path, including quoted paths
- auto-adds `.html` when no extension is supplied
- dark/light adaptive styling
- Copy Markdown button
- Raw / Rendered toggle

### `/export-session-to-browser [output.html]`

Exports the full current pi session to HTML using pi's built-in exporter, then opens it in your browser.

## Install

From this local checkout:

```bash
pi install /absolute/path/to/pi-comfort
```

From GitHub after publishing:

```bash
pi install git:github.com/<you>/pi-comfort
```

Project-local install:

```bash
pi install -l git:github.com/<you>/pi-comfort
```

## Development

Run unit tests:

```bash
npm test
```

Check that pi can load the extension:

```bash
npm run check:extension
```

During active local development, either install this package by path or copy/link the extension into:

```text
~/.pi/agent/extensions/export-to-browser.ts
```

Then reload pi:

```text
/reload
```

## Repository shape

This repo is intentionally a single personal pi package. If an extension becomes broadly useful, it can be split into its own package later.
