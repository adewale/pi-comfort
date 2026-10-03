import assert from "node:assert/strict";
import { test } from "node:test";
// Node >= 22.18 strips TypeScript types natively; the extension only imports types from Pi.
import { renderMarkdownToHtml, renderResponseHtml } from "../extensions/export-to-browser.ts";

test("text after a list renders after the list, not above it", () => {
	const html = renderMarkdownToHtml("Intro\n\n- a\n- b\n\nOutro");
	assert.equal(html, "<p>Intro</p>\n<ul><li>a</li><li>b</li></ul>\n<p>Outro</p>");
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
	const markdown = "Close it: </script><script>alert(1)</script>\n\"quotes\" and \\ backslash\n";
	const html = renderResponseHtml(markdown, { cwd: "/tmp", sessionId: "abc" });
	assert.equal(html.split("</script>").length, 2, "only the page's own </script> may appear");
	const literal = html.match(/const markdown = (.*);\n/)?.[1];
	assert.ok(literal, "embedded markdown literal not found");
	assert.equal(JSON.parse(literal), markdown);
});
