import assert from "node:assert/strict";
import { createJiti } from "/opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent/node_modules/jiti/lib/jiti.mjs";

const jiti = createJiti(import.meta.url, { interopDefault: true });
const mod = await jiti.import(new URL("../extensions/export-to-browser.ts", import.meta.url).pathname);

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("parseCommandArgs handles empty, help, plain, and quoted paths", () => {
  assert.deepEqual(mod.parseCommandArgs(undefined), { help: false });
  assert.deepEqual(mod.parseCommandArgs("--help"), { help: true });
  assert.deepEqual(mod.parseCommandArgs("~/Desktop/out file.html"), { help: false, path: "~/Desktop/out" });
  assert.deepEqual(mod.parseCommandArgs('"~/Desktop/out file.html"'), { help: false, path: "~/Desktop/out file.html" });
});

test("extracts the latest assistant text and skips tool-only assistant messages", () => {
  const branch = [
    { type: "message", message: { role: "assistant", content: [{ type: "text", text: "older" }] } },
    { type: "message", message: { role: "assistant", content: [{ type: "toolCall", name: "bash", arguments: {} }] } },
    { type: "message", message: { role: "user", content: [{ type: "text", text: "ignore" }] } },
  ];
  assert.equal(mod.getLastAssistantOutputFromBranch(branch).text, "older");
});

test("renders markdown into server-side HTML so content exists without browser JS", () => {
  const html = mod.renderResponseHtml("# Title\n\nHello **world**\n\n```js\nconsole.log(1)\n```", {
    cwd: "/tmp/project",
    sessionId: "abc123456789",
    model: "test-model",
  });
  assert.match(html, /<article id="rendered" class="markdown">/);
  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /Hello <strong>world<\/strong>/);
  assert.match(html, /console\.log\(1\)/);
  assert.match(html, /<pre id="raw" class="raw">/);
});

test("generated browser script is syntactically valid", () => {
  const html = mod.renderResponseHtml("Hello", { cwd: "/tmp", sessionId: "abc" });
  const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
  assert.ok(script);
  new Function(script);
});

test("session skim defaults to a navigable list of user prompts", () => {
  const turns = mod.buildSessionTurnsFromBranch([
    { type: "message", message: { role: "user", content: [{ type: "text", text: "First prompt" }] } },
    { type: "message", message: { role: "assistant", content: [{ type: "text", text: "First answer" }, { type: "toolCall", name: "read", arguments: {} }] } },
    { type: "message", message: { role: "user", content: [{ type: "text", text: "Second prompt with details" }] } },
    { type: "message", message: { role: "assistant", content: [{ type: "text", text: "Second answer" }] } },
  ]);
  assert.equal(turns.length, 2);
  assert.equal(turns[0].prompt, "First prompt");
  assert.equal(turns[0].tools[0], "read");
  const html = mod.renderSessionSkimHtml(turns, { cwd: "/tmp/project", sessionId: "abc123" });
  assert.match(html, /<h2>Your prompts<\/h2>/);
  assert.match(html, /First prompt/);
  assert.match(html, /Second prompt with details/);
  assert.match(html, /First answer/);
});

console.log("All export-to-browser tests passed");
