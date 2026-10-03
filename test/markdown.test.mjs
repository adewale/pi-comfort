import assert from "node:assert/strict";
import { test } from "node:test";
// Node >= 22.18 strips TypeScript types natively; the extension only imports types from Pi.
import { renderMarkdownToHtml, renderResponseHtml } from "../extensions/export-to-browser.ts";

test("a wrapped list line stays inside its list item", () => {
	assert.equal(
		renderMarkdownToHtml("- first item\n  wrapped onto a second line\n- second item"),
		"<ul><li>first item wrapped onto a second line</li><li>second item</li></ul>",
	);
});

test("a new list marker right after a bullet is not merged into the item", () => {
	assert.equal(renderMarkdownToHtml("- a\n  - nested\n- c"), "<ul><li>a</li><li>nested</li><li>c</li></ul>");
	assert.equal(renderMarkdownToHtml("- a\n1. one\n2. two"), "<ul><li>a</li></ul>\n<p>1. one 2. two</p>");
});

test("blocks that end a list render after it, in source order", () => {
	assert.equal(renderMarkdownToHtml("Intro\n\n- a\n- b\n\nOutro"), "<p>Intro</p>\n<ul><li>a</li><li>b</li></ul>\n<p>Outro</p>");
	assert.equal(renderMarkdownToHtml("- a\n> q"), "<ul><li>a</li></ul>\n<blockquote>q</blockquote>");
	assert.equal(renderMarkdownToHtml("- a\n# H"), "<ul><li>a</li></ul>\n<h1>H</h1>");
	assert.equal(renderMarkdownToHtml("- a\n```\nx\n```"), "<ul><li>a</li></ul>\n<pre><code>x</code></pre>");
});

test("CRLF input renders like LF input", () => {
	assert.equal(renderMarkdownToHtml("# H\r\n\r\n- a\r\n  b"), renderMarkdownToHtml("# H\n\n- a\n  b"));
});

test("markdown text cannot inject markup, but safe inline formatting survives", () => {
	const html = renderMarkdownToHtml('Hi <img src=x onerror="alert(1)"> **bold** `a<b`\n\n```\n</code><script>x</script>\n```');
	assert.ok(!html.includes("<img"), html);
	assert.ok(!html.includes("<script>"), html);
	assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
	assert.match(html, /<strong>bold<\/strong>/);
	assert.match(html, /<code>a&lt;b<\/code>/);
	assert.match(html, /<pre><code>&lt;\/code&gt;&lt;script&gt;x&lt;\/script&gt;<\/code><\/pre>/);
});

test("only http(s) links become anchors", () => {
	assert.equal(renderMarkdownToHtml("[ok](https://pi.dev/x)"), '<p><a href="https://pi.dev/x">ok</a></p>');
	assert.equal(renderMarkdownToHtml("[bad](javascript:alert(1))"), "<p>[bad](javascript:alert(1))</p>");
});

test("Copy Markdown payload round-trips the exact markdown and cannot close the script tag", () => {
	const markdown = "Close it: </script><script>alert(1)</script> <!--<script>\n\"quotes\" and \\ backslash\n";
	const html = renderResponseHtml(markdown, { cwd: "/tmp", sessionId: "abc" });
	assert.equal(html.split("</script>").length, 2, "only the page's own </script> may appear");
	const literal = html.match(/const markdown = (.*);\n/)?.[1];
	assert.ok(literal, "embedded markdown literal not found");
	assert.ok(!literal.includes("<"), "payload must not contain a raw <");
	assert.equal(JSON.parse(literal), markdown);
	const raw = html.match(/<pre id="raw" class="raw">([\s\S]*?)<\/pre>/)?.[1];
	assert.ok(raw?.includes("&lt;/script&gt;&lt;script&gt;alert(1)"), "raw pane must show escaped markdown");
});
