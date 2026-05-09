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
	const treeItems = turns
		.map((turn, idx) => {
			const active = idx === 0 ? " active" : "";
			const when = turn.timestamp ? new Date(turn.timestamp).toLocaleString() : "";
			const tools = Array.from(new Set(turn.tools));
			const meta = [when, tools.length ? `${tools.length} tool type${tools.length === 1 ? "" : "s"}` : "no tools"].filter(Boolean).join(" • ");
			return `<li class="tree-node${active}" data-turn="${turn.index}" data-search="${htmlEscape(`${turn.prompt} ${turn.assistantText} ${tools.join(" ")}`.toLowerCase())}">
				<button type="button" class="tree-button" data-turn="${turn.index}" aria-selected="${idx === 0 ? "true" : "false"}">
					<span class="twisty">▸</span>
					<span class="node-main"><span class="node-title">${htmlEscape(truncateText(turn.prompt, 128))}</span><span class="node-meta">${htmlEscape(meta)}</span></span>
				</button>
			</li>`;
		})
		.join("\n");
	const panels = turns
		.map((turn, idx) => {
			const tools = Array.from(new Set(turn.tools));
			const assistant = turn.assistantText ? renderMarkdownToHtml(turn.assistantText) : '<p class="empty">No assistant text captured for this turn.</p>';
			const active = idx === 0 ? " active" : "";
			const when = turn.timestamp ? new Date(turn.timestamp).toLocaleString() : "";
			return `<article class="turn-panel${active}" id="turn-${turn.index}" data-turn="${turn.index}">
				<div class="panel-topline"><span>Prompt ${turn.index} of ${turns.length}</span>${when ? `<span>${htmlEscape(when)}</span>` : ""}</div>
				<section class="prompt-card"><h2>Your prompt</h2><pre>${htmlEscape(turn.prompt)}</pre></section>
				${tools.length ? `<section class="tool-card"><h2>Tools used</h2><div class="chips">${tools.map((tool) => `<span>${htmlEscape(tool)}</span>`).join("")}</div></section>` : ""}
				<section class="response-card"><h2>Assistant output</h2><div class="markdown">${assistant}</div></section>
			</article>`;
		})
		.join("\n");
	return String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Pi session browser</title>
<style>
:root { color-scheme: dark light; --bg:#0b0d12; --surface:#111520; --surface-2:#171c2a; --surface-3:#1f2637; --text:#eef3f8; --muted:#96a0b5; --faint:#687086; --accent:#8ea2ff; --accent-2:#7ee2b8; --border:#2b3346; --code:#080a0f; --link:#a9c8ff; --tree:#4b556d; --shadow:rgba(0,0,0,.32); }
@media (prefers-color-scheme: light) { :root { --bg:#f4f1ea; --surface:#fffdf8; --surface-2:#f7f3ea; --surface-3:#eee8dc; --text:#24201a; --muted:#6f675c; --faint:#9a9183; --accent:#4b5bdc; --accent-2:#087f5b; --border:#ded6c8; --code:#f5efe4; --link:#234ecf; --tree:#b8ad9d; --shadow:rgba(65,48,22,.12); } }
* { box-sizing: border-box; }
body { margin:0; min-height:100vh; background:radial-gradient(circle at 12% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 32rem), radial-gradient(circle at 90% 8%, color-mix(in srgb, var(--accent-2) 14%, transparent), transparent 26rem), var(--bg); color:var(--text); font:15px/1.55 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.shell { max-width: 1440px; margin:0 auto; padding:26px 20px 56px; }
header { margin-bottom:18px; display:flex; justify-content:space-between; gap:20px; align-items:end; }
.eyebrow { color:var(--accent-2); font-size:12px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; margin-bottom:6px; }
h1 { margin:0 0 6px; font-size:clamp(26px, 3vw, 40px); letter-spacing:-.045em; line-height:1.05; } .meta { color:var(--muted); font-size:13px; overflow-wrap:anywhere; }
.header-card { min-width:220px; border:1px solid var(--border); background:color-mix(in srgb, var(--surface) 88%, transparent); border-radius:18px; padding:12px 14px; box-shadow:0 18px 50px var(--shadow); } .stat { display:block; font-size:26px; font-weight:760; letter-spacing:-.04em; } .stat-label { color:var(--muted); font-size:12px; }
.layout { display:grid; grid-template-columns:minmax(320px, 410px) minmax(0, 1fr); gap:16px; align-items:start; min-height:calc(100vh - 130px); }
.tree-pane { position:sticky; top:16px; max-height:calc(100vh - 32px); overflow:auto; background:linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, transparent), var(--surface-2)); border:1px solid var(--border); border-radius:22px; padding:14px; box-shadow:0 18px 50px var(--shadow); }
.tree-header { display:flex; justify-content:space-between; align-items:center; margin:0 0 10px; color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.1em; }
.search { width:100%; margin:0 0 12px; border:1px solid var(--border); border-radius:12px; background:var(--code); color:var(--text); padding:10px 11px; outline:none; } .search:focus { border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); }
.tree { list-style:none; padding:0; margin:0; position:relative; }
.tree::before { content:""; position:absolute; left:13px; top:8px; bottom:8px; width:1px; background:linear-gradient(var(--tree), transparent); opacity:.8; }
.tree-node { position:relative; margin:3px 0; padding-left:23px; }
.tree-node::before { content:""; position:absolute; left:13px; top:22px; width:14px; height:1px; background:var(--tree); opacity:.8; }
.tree-button { width:100%; display:flex; gap:8px; align-items:flex-start; text-align:left; color:var(--text); background:transparent; border:1px solid transparent; border-radius:13px; padding:9px 10px; cursor:pointer; }
.tree-button:hover { background:var(--surface-3); border-color:var(--border); }
.tree-node.active .tree-button { background:linear-gradient(135deg, color-mix(in srgb, var(--accent) 24%, var(--surface-3)), var(--surface-3)); border-color:color-mix(in srgb, var(--accent) 58%, var(--border)); box-shadow:inset 0 1px 0 rgba(255,255,255,.05); }
.tree-node.active .twisty { transform:rotate(90deg); color:var(--accent-2); }
.twisty { flex:0 0 auto; color:var(--muted); transition:transform .12s ease; margin-top:1px; }
.node-main { min-width:0; display:block; } .node-title { display:block; font-weight:680; line-height:1.35; } .node-meta { display:block; color:var(--muted); font-size:12px; margin-top:3px; }
.detail-pane { min-width:0; }
.turn-panel { display:none; background:var(--surface); border:1px solid var(--border); border-radius:22px; overflow:hidden; box-shadow:0 18px 50px var(--shadow); }
.turn-panel.active { display:block; }
.panel-topline { display:flex; justify-content:space-between; gap:12px; padding:13px 20px; color:var(--muted); background:linear-gradient(90deg, var(--surface-2), color-mix(in srgb, var(--surface-2) 78%, var(--accent))); border-bottom:1px solid var(--border); font-size:13px; }
.prompt-card, .tool-card, .response-card { padding:20px 22px; border-bottom:1px solid var(--border); } .response-card { border-bottom:0; }
h2 { margin:0 0 10px; color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.11em; }
pre { overflow:auto; white-space:pre-wrap; background:var(--code); border:1px solid var(--border); border-radius:14px; padding:13px; }
.chips { display:flex; flex-wrap:wrap; gap:7px; } .chips span { border:1px solid var(--border); border-radius:999px; padding:4px 9px; background:var(--surface-2); color:var(--muted); font-size:12px; }
.markdown { max-width: 82ch; } .markdown > :first-child { margin-top:0; } .markdown > :last-child { margin-bottom:0; } .markdown h1, .markdown h2, .markdown h3 { color:var(--text); text-transform:none; letter-spacing:-.02em; font-size:revert; }
a { color:var(--link); } code { background:var(--code); border:1px solid var(--border); border-radius:6px; padding:.12em .32em; } pre code { border:0; padding:0; }
.empty { color:var(--muted); }
@media (max-width: 900px) { header { display:block; } .header-card { margin-top:14px; } .layout { grid-template-columns:1fr; } .tree-pane { position:static; max-height:44vh; } }
</style>
</head>
<body>
<div class="shell"><header><div><div class="eyebrow">Pi comfort export</div><h1>Session browser</h1><div class="meta">Generated ${htmlEscape(generated)} • Session ${htmlEscape(metadata.sessionId)} • ${htmlEscape(metadata.cwd)}</div></div><div class="header-card"><span class="stat">${turns.length}</span><span class="stat-label">prompts in this session</span></div></header>
<div class="layout"><aside class="tree-pane"><div class="tree-header"><span>Prompt tree</span><span>${turns.length}</span></div><input class="search" id="tree-search" placeholder="Filter prompts…" autocomplete="off" /><ul class="tree">${treeItems || '<li class="empty">No user prompts found.</li>'}</ul></aside><main class="detail-pane">${panels || '<article class="turn-panel active"><section class="response-card"><p class="empty">No user prompts found.</p></section></article>'}</main></div></div>
<script>
const nodes = Array.from(document.querySelectorAll('.tree-node'));
const buttons = Array.from(document.querySelectorAll('.tree-button'));
const panels = Array.from(document.querySelectorAll('.turn-panel'));
function selectTurn(id) {
  nodes.forEach((node) => node.classList.toggle('active', node.dataset.turn === id));
  buttons.forEach((button) => button.setAttribute('aria-selected', button.dataset.turn === id ? 'true' : 'false'));
  panels.forEach((panel) => panel.classList.toggle('active', panel.dataset.turn === id));
}
buttons.forEach((button) => button.addEventListener('click', () => selectTurn(button.dataset.turn)));
document.getElementById('tree-search')?.addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase().trim();
  nodes.forEach((node) => { node.hidden = query && !node.dataset.search.includes(query); });
});
</script>
</body>
</html>`;
}
export function renderResponseHtml(markdown: string, metadata: { cwd: string; sessionId: string; model?: string; timestamp?: number | string }): string {
	const payload = JSON.stringify(markdown).replace(/</g, "\\u003c");
	const generated = new Date().toLocaleString();
	const when = metadata.timestamp ? new Date(metadata.timestamp).toLocaleString() : generated;
	const rendered = renderMarkdownToHtml(markdown);
	const raw = htmlEscape(markdown);
	const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
	const modelPrefix = metadata.model ? `Model: ${metadata.model}` : "Model unavailable";

	return String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Pi latest response</title>
<style>
:root { color-scheme: dark light; --bg:#0b0d12; --surface:#111520; --surface-2:#171c2a; --text:#eef3f8; --muted:#96a0b5; --accent:#8ea2ff; --accent-2:#7ee2b8; --border:#2b3346; --code:#080a0f; --link:#a9c8ff; --shadow:rgba(0,0,0,.32); }
@media (prefers-color-scheme: light) { :root { --bg:#f4f1ea; --surface:#fffdf8; --surface-2:#f7f3ea; --text:#24201a; --muted:#6f675c; --accent:#4b5bdc; --accent-2:#087f5b; --border:#ded6c8; --code:#f5efe4; --link:#234ecf; --shadow:rgba(65,48,22,.12); } }
* { box-sizing: border-box; }
body { margin:0; min-height:100vh; background:radial-gradient(circle at 10% 0%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 34rem), radial-gradient(circle at 90% 12%, color-mix(in srgb, var(--accent-2) 12%, transparent), transparent 28rem), var(--bg); color:var(--text); font:16px/1.65 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.shell { max-width: 1100px; margin: 0 auto; padding: 34px 20px 72px; }
.masthead { display:grid; grid-template-columns:minmax(0, 1fr) auto; gap:18px; align-items:end; margin-bottom:18px; }
.eyebrow { color:var(--accent-2); font-size:12px; font-weight:760; letter-spacing:.14em; text-transform:uppercase; margin-bottom:7px; }
h1 { margin:0 0 6px; font-size:clamp(30px, 4vw, 52px); line-height:.98; letter-spacing:-.055em; }
.meta { color:var(--muted); font-size:13px; overflow-wrap:anywhere; }
.actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
button { border:1px solid var(--border); color:var(--text); background:linear-gradient(180deg, var(--surface-2), var(--surface)); border-radius:11px; padding:8px 11px; cursor:pointer; box-shadow:0 8px 24px var(--shadow); }
button:hover { border-color:var(--accent); }
.stats { display:flex; gap:10px; margin:0 0 16px; flex-wrap:wrap; } .pill { border:1px solid var(--border); background:color-mix(in srgb, var(--surface) 88%, transparent); border-radius:999px; padding:6px 10px; color:var(--muted); font-size:13px; }
.card { background:linear-gradient(180deg, color-mix(in srgb, var(--surface) 98%, transparent), var(--surface-2)); border:1px solid var(--border); border-radius:24px; box-shadow:0 20px 60px var(--shadow); overflow:hidden; }
.article-bar { display:flex; justify-content:space-between; gap:12px; padding:13px 20px; background:var(--surface-2); border-bottom:1px solid var(--border); color:var(--muted); font-size:13px; }
.markdown, .raw { padding:30px clamp(20px, 5vw, 58px); }
.markdown { max-width: 86ch; margin:0 auto; } .markdown > :first-child { margin-top:0; } .markdown > :last-child { margin-bottom:0; }
.markdown h1, .markdown h2, .markdown h3 { letter-spacing:-.035em; line-height:1.12; margin:1.35em 0 .45em; } .markdown h2 { padding-bottom:.25em; border-bottom:1px solid var(--border); }
p,ul,ol,blockquote,pre,table { margin:.8em 0; } a { color:var(--link); }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:.92em; background:var(--code); border:1px solid var(--border); border-radius:6px; padding:.12em .34em; }
pre { overflow:auto; background:var(--code); border:1px solid var(--border); border-radius:14px; padding:15px 17px; } pre code { background:transparent; border:0; padding:0; font-size:13px; }
blockquote { border-left:4px solid var(--accent-2); padding:.35em 1em; background:color-mix(in srgb, var(--surface) 70%, transparent); border-radius:0 10px 10px 0; }
.raw { display:none; white-space:pre-wrap; font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
body.show-raw .markdown { display:none; } body.show-raw .raw { display:block; }
.toast { position:fixed; right:18px; bottom:18px; background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:10px 12px; color:var(--muted); opacity:0; transform:translateY(8px); transition:.18s; }
.toast.show { opacity:1; transform:translateY(0); }
@media (max-width: 760px) { .masthead { grid-template-columns:1fr; } .actions { justify-content:flex-start; } }
</style>
</head>
<body>
<div class="shell">
<header class="masthead"><div><div class="eyebrow">Pi comfort export</div><h1>Latest response</h1><div class="meta">${htmlEscape(modelPrefix)} • Generated ${htmlEscape(generated)} • Response time ${htmlEscape(when)}</div><div class="meta">Session ${htmlEscape(metadata.sessionId)} • ${htmlEscape(metadata.cwd)}</div></div><div class="actions"><button id="copy">Copy Markdown</button><button id="toggle">Raw / Rendered</button></div></header>
<div class="stats"><span class="pill">${words} words</span><span class="pill">Standalone HTML</span><span class="pill">No network assets</span></div>
<main class="card"><div class="article-bar"><span>Assistant output</span><span>Rendered from Markdown</span></div><article id="rendered" class="markdown">${rendered}</article><pre id="raw" class="raw">${raw}</pre></main>
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
