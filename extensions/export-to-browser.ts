import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, extname, isAbsolute, join, resolve } from "node:path";

type CommandOptions = { path?: string; help: boolean };
type ExecResult = { stdout?: string; stderr?: string; code: number };

type LatestAssistantOutput = {
	text: string;
	model?: string;
	timestamp?: number | string;
};

export function parseCommandArgs(args: unknown): CommandOptions {
	const text = typeof args === "string" ? args.trim() : "";
	if (!text) return { help: false };
	if (text === "--help" || text === "-h" || text === "help") return { help: true };
	const first = text[0];
	let pathArg = "";
	if (first === '"' || first === "'") {
		const end = text.indexOf(first, 1);
		pathArg = end > 0 ? text.slice(1, end) : "";
	} else {
		const whitespace = text.search(/\s/);
		pathArg = whitespace >= 0 ? text.slice(0, whitespace) : text;
	}
	return { path: pathArg || undefined, help: false };
}

export function expandPath(filePath: string, cwd: string): string {
	const expanded = filePath === "~" ? homedir() : filePath.startsWith("~/") ? join(homedir(), filePath.slice(2)) : filePath;
	return isAbsolute(expanded) ? expanded : resolve(cwd, expanded);
}

export function ensureHtmlPath(filePath: string): string {
	return extname(filePath) ? filePath : `${filePath}.html`;
}

function defaultOutputPath(kind: "session" | "response", sessionId: string): string {
	const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	const shortId = sessionId.slice(0, 8) || "session";
	return join(tmpdir(), `pi-${kind}-${shortId}-${stamp}.html`);
}

function openCommand(filePath: string): { command: string; args: string[] } {
	if (process.platform === "darwin") return { command: "open", args: [filePath] };
	if (process.platform === "win32") return { command: "cmd", args: ["/c", "start", "", filePath] };
	return { command: "xdg-open", args: [filePath] };
}

function commandOutput(result: ExecResult): string {
	return `${result.stderr ?? ""}\n${result.stdout ?? ""}`.trim();
}

function notify(ctx: ExtensionCommandContext, message: string, level: "info" | "warning" | "error") {
	if (ctx.hasUI) ctx.ui.notify(message, level);
}

async function openInBrowser(pi: ExtensionAPI, ctx: ExtensionCommandContext, outputPath: string): Promise<boolean> {
	const opener = openCommand(outputPath);
	const opened = await pi.exec(opener.command, opener.args, { timeout: 10_000 });
	if (opened.code !== 0) {
		notify(ctx, `Wrote ${outputPath}, but browser open failed: ${commandOutput(opened) || "unknown error"}`, "warning");
		return false;
	}
	return true;
}

export function textFromContent(content: unknown): string {
	if (typeof content === "string") return content.trim();
	if (!Array.isArray(content)) return "";
	const parts: string[] = [];
	for (const item of content) {
		if (!item || typeof item !== "object") continue;
		const block = item as { type?: string; text?: unknown };
		if (block.type === "text" && typeof block.text === "string") parts.push(block.text);
	}
	return parts.join("\n").trim();
}

export function getLastAssistantOutputFromBranch(branch: unknown[]): LatestAssistantOutput | undefined {
	for (let i = branch.length - 1; i >= 0; i--) {
		const entry = branch[i] as any;
		const message = entry?.type === "message" ? entry.message : undefined;
		if (message?.role !== "assistant") continue;
		const text = textFromContent(message.content);
		if (!text) continue;
		return { text, model: message.model, timestamp: message.timestamp ?? entry.timestamp };
	}
	return undefined;
}

function getLastAssistantOutput(ctx: ExtensionCommandContext): LatestAssistantOutput | undefined {
	return getLastAssistantOutputFromBranch(ctx.sessionManager.getBranch() as unknown[]);
}

export function htmlEscape(value: string): string {
	return value.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
}

function inlineMarkdown(value: string): string {
	return htmlEscape(value)
		.replace(/`([^`]+)`/g, "<code>$1</code>")
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
}

export function renderMarkdownToHtml(markdown: string): string {
	const lines = markdown.replace(/\r\n/g, "\n").split("\n");
	const out: string[] = [];
	const paragraph: string[] = [];
	let list: string[] = [];
	let code: string[] | undefined;

	const flushParagraph = () => {
		if (paragraph.length === 0) return;
		out.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
		paragraph.length = 0;
	};
	const flushList = () => {
		if (list.length === 0) return;
		out.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
		list = [];
	};
	const flushCode = () => {
		if (!code) return;
		out.push(`<pre><code>${htmlEscape(code.join("\n"))}</code></pre>`);
		code = undefined;
	};

	for (const line of lines) {
		if (line.startsWith("```")) {
			if (code) flushCode();
			else {
				flushParagraph();
				flushList();
				code = [];
			}
			continue;
		}
		if (code) {
			code.push(line);
			continue;
		}
		if (!line.trim()) {
			flushParagraph();
			flushList();
			continue;
		}
		const heading = line.match(/^(#{1,4})\s+(.+)$/);
		if (heading) {
			flushParagraph();
			flushList();
			const level = heading[1].length;
			out.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
			continue;
		}
		if (/^---+$/.test(line.trim())) {
			flushParagraph();
			flushList();
			out.push("<hr>");
			continue;
		}
		const bullet = line.match(/^[-*]\s+(.+)$/);
		if (bullet) {
			flushParagraph();
			list.push(bullet[1]);
			continue;
		}
		const quote = line.match(/^>\s?(.*)$/);
		if (quote) {
			flushParagraph();
			flushList();
			out.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
			continue;
		}
		paragraph.push(line.trim());
	}
	flushParagraph();
	flushList();
	flushCode();
	return out.join("\n");
}


type SessionTurn = {
	index: number;
	prompt: string;
	assistantText: string;
	tools: string[];
	timestamp?: number | string;
};

function truncateText(text: string, max = 180): string {
	const compact = text.replace(/\s+/g, " ").trim();
	return compact.length > max ? `${compact.slice(0, max - 1)}…` : compact;
}

function toolNamesFromContent(content: unknown): string[] {
	if (!Array.isArray(content)) return [];
	const names: string[] = [];
	for (const item of content) {
		if (!item || typeof item !== "object") continue;
		const block = item as { type?: string; name?: unknown };
		if (block.type === "toolCall" && typeof block.name === "string") names.push(block.name);
	}
	return names;
}

export function buildSessionTurnsFromBranch(branch: unknown[]): SessionTurn[] {
	const turns: SessionTurn[] = [];
	let current: SessionTurn | undefined;
	for (const entry of branch) {
		const record = entry as any;
		const message = record?.type === "message" ? record.message : undefined;
		if (!message?.role) continue;
		if (message.role === "user") {
			const prompt = textFromContent(message.content);
			if (!prompt) continue;
			current = { index: turns.length + 1, prompt, assistantText: "", tools: [], timestamp: message.timestamp ?? record.timestamp };
			turns.push(current);
			continue;
		}
		if (!current || message.role !== "assistant") continue;
		const text = textFromContent(message.content);
		if (text) current.assistantText = current.assistantText ? `${current.assistantText}\n\n${text}` : text;
		current.tools.push(...toolNamesFromContent(message.content));
	}
	return turns;
}

export function renderSessionSkimHtml(turns: SessionTurn[], metadata: { cwd: string; sessionId: string }): string {
	const generated = new Date().toLocaleString();
	const promptItems = turns
		.map((turn) => {
			const when = turn.timestamp ? new Date(turn.timestamp).toLocaleString() : "";
			const tools = Array.from(new Set(turn.tools));
			const assistant = turn.assistantText ? renderMarkdownToHtml(turn.assistantText) : '<p class="empty">No assistant text captured for this turn.</p>';
			return `<section class="turn" id="turn-${turn.index}">
				<details>
					<summary><span class="num">${turn.index}</span><span class="prompt">${htmlEscape(truncateText(turn.prompt, 220))}</span></summary>
					<div class="turn-meta">${htmlEscape(when)}${tools.length ? ` • Tools: ${htmlEscape(tools.join(", "))}` : ""}</div>
					<div class="prompt-full"><h3>Your prompt</h3><pre>${htmlEscape(turn.prompt)}</pre></div>
					<div class="assistant-full"><h3>Assistant response</h3><div class="markdown">${assistant}</div></div>
				</details>
			</section>`;
		})
		.join("\n");
	const nav = turns.map((turn) => `<li><a href="#turn-${turn.index}">${htmlEscape(truncateText(turn.prompt, 120))}</a></li>`).join("\n");
	return String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Pi session skim</title>
<style>
:root { color-scheme: dark light; --bg:#0f1117; --card:#171a23; --text:#e6edf3; --muted:#8b949e; --accent:#7c9cff; --border:#303645; --code:#0b0d12; --link:#9cc8ff; }
@media (prefers-color-scheme: light) { :root { --bg:#f6f8fa; --card:#fff; --text:#24292f; --muted:#57606a; --accent:#3451d1; --border:#d0d7de; --code:#f6f8fa; --link:#0969da; } }
* { box-sizing: border-box; } body { margin:0; background:var(--bg); color:var(--text); font:15px/1.55 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.shell { max-width: 1180px; margin:0 auto; padding:28px 18px 60px; }
header { margin-bottom:18px; } h1 { margin:0 0 6px; font-size:26px; } .meta { color:var(--muted); font-size:13px; overflow-wrap:anywhere; }
.layout { display:grid; grid-template-columns:minmax(220px, 320px) minmax(0, 1fr); gap:18px; align-items:start; }
nav { position:sticky; top:16px; max-height:calc(100vh - 32px); overflow:auto; background:var(--card); border:1px solid var(--border); border-radius:14px; padding:14px; }
nav h2 { margin:0 0 10px; font-size:14px; color:var(--muted); text-transform:uppercase; letter-spacing:.08em; } nav ol { margin:0; padding-left:20px; } nav li { margin:.35em 0; } a { color:var(--link); text-decoration:none; } a:hover { text-decoration:underline; }
.turn { margin-bottom:10px; background:var(--card); border:1px solid var(--border); border-radius:14px; overflow:hidden; }
summary { cursor:pointer; display:flex; gap:12px; align-items:flex-start; padding:13px 15px; } summary:hover { background:color-mix(in srgb, var(--card) 88%, var(--accent)); }
.num { flex:0 0 auto; color:var(--muted); font-variant-numeric:tabular-nums; } .prompt { font-weight:600; }
.turn-meta { color:var(--muted); font-size:12px; padding:0 15px 10px 48px; }
.prompt-full, .assistant-full { border-top:1px solid var(--border); padding:14px 18px; } h3 { margin:0 0 8px; color:var(--muted); font-size:13px; text-transform:uppercase; letter-spacing:.08em; }
pre { overflow:auto; white-space:pre-wrap; background:var(--code); border:1px solid var(--border); border-radius:10px; padding:12px; }
.markdown > :first-child { margin-top:0; } .markdown > :last-child { margin-bottom:0; } code { background:var(--code); border:1px solid var(--border); border-radius:5px; padding:.12em .32em; } pre code { border:0; padding:0; }
.empty { color:var(--muted); }
@media (max-width: 820px) { .layout { grid-template-columns:1fr; } nav { position:static; max-height:none; } }
</style>
</head>
<body>
<div class="shell"><header><h1>Pi session skim</h1><div class="meta">${turns.length} prompts • Generated ${htmlEscape(generated)} • Session ${htmlEscape(metadata.sessionId)} • ${htmlEscape(metadata.cwd)}</div></header>
<div class="layout"><nav><h2>Your prompts</h2><ol>${nav}</ol></nav><main>${promptItems || '<p class="empty">No user prompts found.</p>'}</main></div></div>
</body>
</html>`;
}

export function renderResponseHtml(markdown: string, metadata: { cwd: string; sessionId: string; model?: string; timestamp?: number | string }): string {
	const payload = JSON.stringify(markdown).replace(/</g, "\\u003c");
	const generated = new Date().toLocaleString();
	const when = metadata.timestamp ? new Date(metadata.timestamp).toLocaleString() : generated;
	const rendered = renderMarkdownToHtml(markdown);
	const raw = htmlEscape(markdown);
	const modelPrefix = metadata.model ? `Model: ${metadata.model} • ` : "";

	return String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Pi latest response</title>
<style>
:root { color-scheme: dark light; --bg:#0f1117; --card:#171a23; --text:#e6edf3; --muted:#8b949e; --accent:#7c9cff; --border:#303645; --code:#0b0d12; --link:#9cc8ff; }
@media (prefers-color-scheme: light) { :root { --bg:#f6f8fa; --card:#fff; --text:#24292f; --muted:#57606a; --accent:#3451d1; --border:#d0d7de; --code:#f6f8fa; --link:#0969da; } }
* { box-sizing: border-box; }
body { margin:0; background:radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 18%, transparent), transparent 32rem), var(--bg); color:var(--text); font:16px/1.6 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.shell { max-width: 980px; margin: 0 auto; padding: 32px 20px 64px; }
header { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; margin-bottom:18px; }
h1 { margin:0 0 6px; font-size:24px; letter-spacing:-0.02em; }
.meta { color:var(--muted); font-size:13px; overflow-wrap:anywhere; }
.actions { display:flex; gap:8px; flex-wrap:wrap; }
button { border:1px solid var(--border); color:var(--text); background:color-mix(in srgb, var(--card) 86%, var(--accent)); border-radius:8px; padding:7px 10px; cursor:pointer; }
button:hover { border-color:var(--accent); }
.card { background:color-mix(in srgb, var(--card) 94%, transparent); border:1px solid var(--border); border-radius:16px; padding:26px; box-shadow:0 16px 40px rgba(0,0,0,.22); }
.markdown > :first-child { margin-top:0; } .markdown > :last-child { margin-bottom:0; }
h2,h3,h4 { line-height:1.25; margin:1.35em 0 .45em; letter-spacing:-0.015em; }
h2 { padding-bottom:.25em; border-bottom:1px solid var(--border); }
p,ul,ol,blockquote,pre,table { margin:.75em 0; }
a { color:var(--link); }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:.92em; background:var(--code); border:1px solid var(--border); border-radius:5px; padding:.12em .32em; }
pre { overflow:auto; background:var(--code); border:1px solid var(--border); border-radius:12px; padding:14px 16px; }
pre code { background:transparent; border:0; padding:0; font-size:13px; }
blockquote { border-left:4px solid var(--accent); padding:.2em 1em; background:color-mix(in srgb, var(--card) 70%, transparent); border-radius:0 8px 8px 0; }
li + li { margin-top:.2em; }
hr { border:0; border-top:1px solid var(--border); margin:1.5em 0; }
.raw { display:none; white-space:pre-wrap; font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
body.show-raw .markdown { display:none; } body.show-raw .raw { display:block; }
.toast { position:fixed; right:18px; bottom:18px; background:var(--card); border:1px solid var(--border); border-radius:10px; padding:10px 12px; color:var(--muted); opacity:0; transform:translateY(8px); transition:.18s; }
.toast.show { opacity:1; transform:translateY(0); }
</style>
</head>
<body>
<div class="shell">
<header>
<div>
<h1>Pi latest response</h1>
<div class="meta">${htmlEscape(modelPrefix)}Generated: ${htmlEscape(generated)} • Response time: ${htmlEscape(when)}</div>
<div class="meta">Session: ${htmlEscape(metadata.sessionId)} • ${htmlEscape(metadata.cwd)}</div>
</div>
<div class="actions"><button id="copy">Copy Markdown</button><button id="toggle">Raw / Rendered</button></div>
</header>
<main class="card"><article id="rendered" class="markdown">${rendered}</article><pre id="raw" class="raw">${raw}</pre></main>
</div>
<div id="toast" class="toast">Copied</div>
<script>
const markdown = ${payload};
document.getElementById('toggle').onclick = () => document.body.classList.toggle('show-raw');
document.getElementById('copy').onclick = async () => { await navigator.clipboard.writeText(markdown); const t=document.getElementById('toast'); t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 1200); };
</script>
</body>
</html>`;
}

export default function exportToBrowserExtension(pi: ExtensionAPI) {
	pi.registerCommand("export-session-to-browser", {
		description: "Open a skim-friendly HTML view of the current session, defaulting to your prompts",
		handler: async (args, ctx) => {
			const options = parseCommandArgs(args);
			if (options.help) return notify(ctx, "Usage: /export-session-to-browser [output.html]", "info");
			try {
				await ctx.waitForIdle();
				const outputPath = options.path ? ensureHtmlPath(expandPath(options.path, ctx.cwd)) : defaultOutputPath("session", ctx.sessionManager.getSessionId());
				mkdirSync(dirname(outputPath), { recursive: true });
				const turns = buildSessionTurnsFromBranch(ctx.sessionManager.getBranch() as unknown[]);
				writeFileSync(outputPath, renderSessionSkimHtml(turns, { cwd: ctx.cwd, sessionId: ctx.sessionManager.getSessionId() }), "utf8");
				const opened = await openInBrowser(pi, ctx, outputPath);
				if (opened) notify(ctx, `Session skim opened: ${outputPath}`, "info");
			} catch (error) {
				notify(ctx, `Session skim export failed: ${error instanceof Error ? error.message : String(error)}`, "error");
			}
		},
	});

	pi.registerCommand("export-to-browser", {
		description: "Open the latest assistant response as a nice standalone HTML page",
		handler: async (args, ctx) => {
			const options = parseCommandArgs(args);
			if (options.help) return notify(ctx, "Usage: /export-to-browser [output.html]", "info");
			try {
				await ctx.waitForIdle();
				const latest = getLastAssistantOutput(ctx);
				if (!latest) return notify(ctx, "No assistant response found to export", "warning");
				const outputPath = options.path ? ensureHtmlPath(expandPath(options.path, ctx.cwd)) : defaultOutputPath("response", ctx.sessionManager.getSessionId());
				mkdirSync(dirname(outputPath), { recursive: true });
				writeFileSync(outputPath, renderResponseHtml(latest.text, { cwd: ctx.cwd, sessionId: ctx.sessionManager.getSessionId(), model: latest.model, timestamp: latest.timestamp }), "utf8");
				const opened = await openInBrowser(pi, ctx, outputPath);
				if (opened) notify(ctx, `Latest response opened: ${outputPath}`, "info");
			} catch (error) {
				notify(ctx, `Latest response export failed: ${error instanceof Error ? error.message : String(error)}`, "error");
			}
		},
	});
}
