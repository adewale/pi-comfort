import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { buildSessionTurnsFromBranch, renderResponseHtml, renderSessionSkimHtml } from "../extensions/export-to-browser.ts";

// The generated pages are standalone HTML with an inline script, so only a real browser
// shows whether that script works. Pages are served from a fake localhost origin, which
// counts as a secure context, so the clipboard API is available.
const origin = "http://localhost:4173";
let browser;

before(async () => {
	browser = await chromium.launch();
});

after(async () => {
	await browser?.close();
});

async function open(html) {
	const context = await browser.newContext();
	await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
	const page = await context.newPage();
	const errors = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.route("**/*", (route) =>
		route.request().url() === `${origin}/` ? route.fulfill({ contentType: "text/html", body: html }) : route.abort(),
	);
	await page.goto(`${origin}/`);
	return { page, errors };
}

test("response page: hostile markdown stays inert, Raw toggles and Copy writes the exact markdown", async () => {
	const markdown = '# Title\n\n</script><script>window.__pwned = 1</script>\n\n<img src=x onerror="window.__pwned = 2">\n\n- one\n  wrapped';
	const { page, errors } = await open(renderResponseHtml(markdown, { cwd: "/tmp/project", sessionId: "abc123" }));

	assert.equal(await page.evaluate(() => window.__pwned), undefined);
	assert.equal(await page.locator("#rendered img").count(), 0);
	assert.equal(await page.locator("#rendered li").first().textContent(), "one wrapped");

	assert.ok(await page.locator("#rendered").isVisible());
	assert.ok(await page.locator("#raw").isHidden());
	await page.click("#toggle");
	assert.ok(await page.locator("#rendered").isHidden());
	assert.ok(await page.locator("#raw").isVisible());
	assert.equal(await page.locator("#raw").textContent(), markdown);

	await page.click("#copy");
	assert.equal(await page.evaluate(() => navigator.clipboard.readText()), markdown);
	assert.deepEqual(errors, []);
});

test("session page: clicking a prompt shows its panel and the filter hides non-matching prompts", async () => {
	const turns = buildSessionTurnsFromBranch([
		{ type: "message", message: { role: "user", content: [{ type: "text", text: "First prompt" }] } },
		{ type: "message", message: { role: "assistant", content: [{ type: "text", text: "First answer" }] } },
		{ type: "message", message: { role: "user", content: [{ type: "text", text: "Second prompt about zebras" }] } },
		{ type: "message", message: { role: "assistant", content: [{ type: "text", text: "Second answer" }] } },
	]);
	const { page, errors } = await open(renderSessionSkimHtml(turns, { cwd: "/tmp/project", sessionId: "abc123" }));
	const panel = (n) => page.locator(`#turn-${n}`);
	const node = (n) => page.locator(`.tree-node[data-turn="${n}"]`);

	assert.ok(await panel(1).isVisible());
	assert.ok(await panel(2).isHidden());
	await node(2).locator("button").click();
	assert.ok(await panel(1).isHidden());
	assert.ok(await panel(2).isVisible());
	assert.equal(await node(2).locator("button").getAttribute("aria-selected"), "true");
	assert.equal(await node(1).locator("button").getAttribute("aria-selected"), "false");

	await page.fill("#tree-search", "ZEBRAS");
	assert.ok(await node(1).isHidden());
	assert.ok(await node(2).isVisible());
	await page.fill("#tree-search", "");
	assert.ok(await node(1).isVisible());
	assert.deepEqual(errors, []);
});
