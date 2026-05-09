# pi-comfort

These are the Pi extensions I created to make [Pi](https://pi.dev) more comfortable for me.

This is **not** meant to be a universal workflow package. It is my personal comfort layer: small commands, UI affordances, and experiments that reduce friction in the way I use Pi. If any of it is useful to you, I recommend you **fork this repo** and adapt it to your own preferences instead of treating it as a canonical package.

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

Exports the full current Pi session to HTML using Pi's built-in exporter, then opens it in your browser.

## Install

From GitHub:

```bash
pi install git:github.com/oshineye/pi-comfort
```

Project-local install:

```bash
pi install -l git:github.com/oshineye/pi-comfort
```

From a local checkout:

```bash
pi install /absolute/path/to/pi-comfort
```

## Forking recommended

These extensions encode my preferences. The best way to use this repo is usually:

1. Fork it.
2. Rename/change/remove commands to match your workflow.
3. Install your fork:

```bash
pi install git:github.com/<you>/pi-comfort
```

## Development

Run unit tests:

```bash
npm test
```

Check that Pi can load the extension:

```bash
npm run check:extension
```

During active local development, either install this package by path or copy/link the extension into:

```text
~/.pi/agent/extensions/export-to-browser.ts
```

Then reload Pi:

```text
/reload
```

## Repository shape

This repo is intentionally a single personal Pi package. If an extension becomes broadly useful, it can be split into its own package later.
