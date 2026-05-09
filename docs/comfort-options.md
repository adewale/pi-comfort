# Pi comfort options: extensions and configuration points

Generated: 2026-05-09  
Scope: pi v0.73.1 docs plus npm `pi-package` search. Third-party packages are **not vetted**; extensions execute arbitrary code and skills can instruct the agent to run code. Review source before installing.

## Your current local pi state

- Installed pi packages: none (`pi list` reported no packages installed)
- Global settings: `~/.pi/agent/settings.json`
  - `defaultProvider`: `openai-codex`
  - `defaultModel`: `gpt-5.5`
  - `defaultThinkingLevel`: `medium`
- Local project settings file: `.pi/settings.json` can override globals for this repo.

## Where pi loads customizations

| Resource | Global location | Project location | Settings key | CLI flag |
|---|---|---|---|---|
| Extensions | `~/.pi/agent/extensions/*.ts`, `~/.pi/agent/extensions/*/index.ts` | `.pi/extensions/*.ts`, `.pi/extensions/*/index.ts` | `extensions` | `-e`, `--extension` |
| Skills | `~/.pi/agent/skills/`, `~/.agents/skills/` | `.pi/skills/`, `.agents/skills/` in cwd/ancestors | `skills` | `--skill` |
| Prompt templates | `~/.pi/agent/prompts/*.md` | `.pi/prompts/*.md` | `prompts` | `--prompt-template` |
| Themes | `~/.pi/agent/themes/*.json` | `.pi/themes/*.json` | `themes` | `--theme` |
| Pi packages | global settings packages | project settings packages (`-l`) | `packages` | `-e npm:pkg` for temporary package extension load |
| Keybindings | `~/.pi/agent/keybindings.json` | n/a | n/a | n/a |
| Models/providers | `~/.pi/agent/models.json` | n/a | n/a | `--provider`, `--model`, `--models` |
| Context files | `~/.pi/agent/AGENTS.md` | `AGENTS.md`/`CLAUDE.md` in cwd/ancestors | n/a | `--no-context-files` |
| System prompt | `~/.pi/agent/SYSTEM.md`, `APPEND_SYSTEM.md` | `.pi/SYSTEM.md`, `.pi/APPEND_SYSTEM.md` | n/a | `--system-prompt`, `--append-system-prompt` |

Reload most resources in a running session with `/reload`; themes hot-reload while edited.

## Existing third-party pi packages from npm

Install examples:

```bash
pi install npm:pi-web-access
pi install npm:@gotgenes/pi-permission-system
pi install npm:pi-subagents
pi install npm:pi-show-diffs -l   # project-local
pi config                         # enable/disable resources
```

Packages found by `npm search --json keywords:pi-package --searchlimit=100`:

| Package | Version | What it says it does | Repository / link |
|---|---:|---|---|
| `pi-subagents` | 0.24.0 | Delegating tasks to subagents with chains, parallel execution, TUI clarification | https://github.com/nicobailon/pi-subagents |
| `context-mode` | 1.0.111 | Context-window savings, sandboxed execution, knowledge base, intent search | https://github.com/mksglu/context-mode |
| `pi-mcp-adapter` | 2.5.4 | MCP adapter extension for pi | https://github.com/nicobailon/pi-mcp-adapter |
| `pi-web-access` | 0.10.7 | Web search, URL fetch, GitHub repo clone, PDF, YouTube/video understanding | https://github.com/nicobailon/pi-web-access |
| `@ollama/pi-web-search` | 0.0.5 | Web search/fetch via Ollama web APIs | https://www.npmjs.com/package/@ollama/pi-web-search |
| `@plannotator/pi-extension` | 0.19.11 | Interactive plan review and annotation | https://github.com/backnotprop/plannotator |
| `pi-lens` | 3.8.42 | LSP, linters, formatters, type-checking, structural analysis | https://github.com/apmantza/pi-lens |
| `@juicesharp/rpiv-ask-user-question` | 1.3.0 | Structured questionnaire/ask-user tool | https://github.com/juicesharp/rpiv-mono |
| `pi-markdown-preview` | 0.9.8 | Markdown/LaTeX preview in terminal/browser/PDF | https://github.com/omaclaren/pi-markdown-preview |
| `pi-simplify` | 0.2.0 | Reviews changed code for clarity/maintainability | https://github.com/MattDevy/pi-extensions |
| `pi-btw` | 0.4.0 | Parallel side conversations with `/btw` | https://github.com/dbachelder/pi-btw |
| `@juicesharp/rpiv-todo` | 1.3.0 | Live model todo overlay surviving reload/compaction | https://github.com/juicesharp/rpiv-mono |
| `pi-gsd` | 2.1.4 | Planning/spec-driven toolkit | https://github.com/fulgidus/pi-gsd |
| `pi-powerline-footer` | 0.5.1 | Powerline-style status bar | https://github.com/nicobailon/pi-powerline-footer |
| `@juicesharp/rpiv-btw` | 1.3.0 | Side-question slash command | https://github.com/juicesharp/rpiv-mono |
| `@runfusion/fusion` | 0.23.0 | HTTP API server/daemon/dashboard/task tooling | https://github.com/Runfusion/Fusion |
| `@juicesharp/rpiv-advisor` | 1.3.0 | Second-opinion reviewer model | https://github.com/juicesharp/rpiv-mono |
| `glimpseui` | 0.8.0 | Native micro-UI for scripts/agents | https://github.com/hazat/glimpse |
| `taskplane` | 0.28.8 | Parallel task execution/orchestration | https://github.com/HenryLach/taskplane |
| `@samfp/pi-memory` | 1.0.4 | Persistent memory for preferences/patterns | https://github.com/samfoy/pi-memory |
| `@juicesharp/rpiv-web-tools` | 1.3.0 | Brave-backed web search/fetch | https://github.com/juicesharp/rpiv-mono |
| `@tintinweb/pi-subagents` | 0.7.1 | Claude Code-style autonomous subagents | https://github.com/tintinweb/pi-subagents |
| `@juicesharp/rpiv-pi` | 1.3.0 | Skill-based dev workflow: research/design/plan/implement/validate | https://github.com/juicesharp/rpiv-mono |
| `@callumvass/forgeflow-dev` | 0.36.0 | TDD implementation, code review, architecture, Datadog investigations | https://github.com/CallumVass/forgeflow |
| `pi-ask-user` | 0.10.0 | Ask-user UI with selection/multiselect/freeform input | https://github.com/edlsh/pi-ask-user |
| `@aliou/pi-processes` | 0.8.1 | Process-related extension | https://github.com/aliou/pi-processes |
| `@juicesharp/rpiv-args` | 1.3.0 | Shell-style `$1`/`$ARGUMENTS` placeholders in skills | https://github.com/juicesharp/rpiv-mono |
| `pi-smart-fetch` | 0.3.5 | Smart web fetch with TLS impersonation/content extraction | https://github.com/Thinkscape/agent-smart-fetch |
| `@gotgenes/pi-permission-system` | 5.14.0 | Permission enforcement/access-control | https://github.com/gotgenes/pi-permission-system |
| `pi-studio` | 0.7.1 | Two-pane browser workspace, annotations, previews | https://github.com/omaclaren/pi-studio |
| `pi-agent-flow` | 1.8.8 | Flow-state delegation | https://github.com/tuanhung303/pi-agent-flow |
| `@tmustier/pi-ralph-wiggum` | 0.2.1 | Long-running iterative development loops | https://github.com/tmustier/pi-extensions |
| `pi-depo` | 0.1.43 | Declarative package manager for skills/extensions/hooks/MCP | https://github.com/fulgidus/pi-depo |
| `pi-crew` | 0.1.49 | AI teams, workflows, worktrees, async orchestration | https://github.com/baphuongna/pi-crew |
| `pi-prompt-template-model` | 0.9.3 | Model selector for prompt templates | https://github.com/nicobailon/pi-prompt-template-model |
| `@heart-of-gold/toolkit` | 0.1.51 | Cross-harness skill installer | https://github.com/ondrej-svec/heart-of-gold-toolkit |
| `pi-docparser` | 1.1.1 | PDF/Office/spreadsheet/image parsing with LiteParse | https://github.com/maxedapps/pi-docparser |
| `pi-schedule-prompt` | 0.3.0 | Recurring/one-shot scheduled prompts | https://github.com/tintinweb/pi-schedule-prompt |
| `@astrofoundry/pi-astro` | 0.14.6 | Personal customization bundle | https://github.com/astrofoundry/pi-astro |
| `@ff-labs/pi-fff` | 0.7.2 | FFF-powered fuzzy file/content search | https://github.com/dmtrKovalenko/fff.nvim |
| `@companion-ai/feynman` | 0.2.49 | Research-first CLI agent | https://github.com/getcompanion-ai/feynman |
| `whatsapp-pi` | 1.0.45 | WhatsApp integration | https://github.com/RaphaCastelloes/whatsapp-pi |
| `dripline` | 0.9.12 | SQL/cloud/API querying | https://github.com/Michaelliv/dripline |
| `pi-convex` | 1.5.8 | Convex Cloud queries/mutations/project validation | https://github.com/serlismaldonado/pi-convex |
| `pi-mermaid` | 0.3.0 | Mermaid diagrams rendered as ASCII | https://github.com/Gurpartap/pi-mermaid |
| `@feniix/pi-notion` | 2.2.2 | Notion API read/search/manage | https://github.com/feniix/pi-extensions |
| `@leing2021/super-pi` | 0.23.6 | Compound engineering / iterative workflows | https://github.com/leing2021/super-pi |
| `@aliou/pi-guardrails` | 0.11.2 | Guardrails/security | https://github.com/aliou/pi-guardrails |
| `@llblab/pi-telegram` | 0.9.5 | Telegram DM bridge | https://github.com/llblab/pi-telegram |
| `@walterra/pi-charts` | 0.0.5 | Vega-Lite charts as inline images | https://github.com/walterra/agent-tools |
| `pi-zotero` | 0.1.0 | Zotero search/citation/PDF annotation tools | https://github.com/nicehiro/dotfiles |
| `pi-lean-ctx` | 3.5.9 | Routes tools through lean-ctx for token savings | https://github.com/yvgude/lean-ctx |
| `pi-agent-browser-native` | 0.2.22 | Browser automation via agent-browser | https://github.com/fitchmultz/pi-agent-browser-native |
| `@callumvass/forgeflow-pm` | 0.31.0 | PM pipeline: PRD refinement, issue creation | https://github.com/CallumVass/forgeflow |
| `@apmantza/greedysearch-pi` | 1.8.7 | Browser-based multi-engine AI search, no API keys | https://github.com/apmantza/GreedySearch-pi |
| `@kaiserlich-dev/pi-session-search` | 1.1.3 | Full-text search across pi sessions | https://github.com/kaiserlich-dev/pi-session-search |
| `pi-interactive-shell` | 0.13.0 | Run agents in TUI overlays/supervised shells | https://github.com/nicobailon/pi-interactive-shell |
| `pi-oracle` | 0.6.16 | ChatGPT web-oracle with browser auth | https://github.com/fitchmultz/pi-oracle |
| `@ifi/oh-pi-themes` | 0.5.1 | Theme bundle: cyberpunk, nord, gruvbox, tokyo-night, catppuccin, etc. | https://github.com/ifiokjr/oh-pi |
| `pi-antigravity-rotator` | 1.10.1 | Google Antigravity quota/account rotation proxy | https://github.com/tuxevil/pi-antigravity-rotator |
| `pi-messenger-swarm` | 0.25.4 | Multi-agent messaging/task orchestration | https://github.com/monotykamary/pi-messenger-swarm |
| `pi-hermes-memory` | 0.6.9 | Persistent memory, session search, secret scanning | https://github.com/chandra447/pi-hermes-memory |
| `pi-memctx` | 0.13.0 | Memory context injection via Markdown packs | https://github.com/weauratech/pi-memctx |
| `pi-teams` | 0.9.14 | Agent teams/coordination | https://github.com/burggraf/pi-teams |
| `pi-memory-md` | 0.1.36 | Markdown/git-based memory management | https://github.com/VandeeFeng/pi-memory-md |
| `pi-interview` | 0.8.7 | Interactive interview forms | https://github.com/nicobailon/pi-interview-tool |
| `pi-qmd-ledger` | 0.5.2 | JSONL ledger, search, HITL, dynamic context injection | https://github.com/kylebrodeur/pi-qmd-ledger |
| `amp-themes` | 0.2.17 | Amp-inspired theme/editor chrome/tool display | https://www.npmjs.com/package/amp-themes |
| `@arshan-dev/pi-ideas` | 0.1.20 | Idea capture/browse/expand/ship | https://www.npmjs.com/package/@arshan-dev/pi-ideas |
| `@feniix/pi-specdocs` | 2.4.4 | PRDs, ADRs, implementation plans with cross-reference | https://github.com/feniix/pi-extensions |
| `@lnilluv/pi-ralph-loop` | 1.8.0 | Autonomous coding iterations with supervision | https://github.com/lnilluv/pi-ralph-loop |
| `pi-continue` | 0.6.7 | Mid-turn continuation/compaction/handoff ledger | https://github.com/Tiziano-AI/pi-continue |
| `agent-comms` | 1.8.0 | Cross-harness communication mesh | https://github.com/ExaDev/agent-comms |
| `@blackbelt-technology/pi-agent-dashboard` | 0.5.1 | Web dashboard for pi sessions | https://github.com/BlackBeltTechnology/pi-agent-dashboard |
| `pi-claude-style-tools` | 1.0.23 | Claude Code-style tool rows/rendering | https://github.com/FammasMaz/pi-cc-tools |
| `@eforge-build/pi-eforge` | 0.7.12 | Enqueue/run/monitor builds | https://github.com/eforge-build/eforge |
| `pi-tool-display` | 0.3.6 | Compact tool rendering/diff/output truncation | https://github.com/MasuRii/pi-tool-display |
| `oira666_pi-subagent` | 0.2.16 | Subagent delegation | https://github.com/gee666/pi-subagent |
| `@sting8k/pi-vcc` | 0.3.12 | Algorithmic conversation compactor | https://github.com/sting8k/pi-vcc |
| `@feniix/pi-exa` | 3.5.0 | Exa web search/content fetching | https://github.com/feniix/pi-extensions |
| `@tmustier/pi-usage-extension` | 0.3.2 | Usage statistics dashboard | https://github.com/tmustier/pi-extensions |
| `@0xkobold/pi-codebase-wiki` | 0.7.4 | Self-updating codebase wiki | https://www.npmjs.com/package/@0xkobold/pi-codebase-wiki |
| `pi-multiagent` | 0.6.2 | `agent_team` delegation tool and skill | https://github.com/Tiziano-AI/pi-multiagent |
| `@ifi/pi-extension-subagents` | 0.5.1 | Full-featured subagent orchestration | https://github.com/ifiokjr/oh-pi |
| `@howaboua/pi-codex-conversion` | 1.0.31 | Codex-oriented tool/prompt adapter | https://github.com/IgorWarzocha/pi-codex-conversion |
| `@aretw0/web-skills` | 0.7.0 | Web skills: search/browser automation via CDP | https://github.com/aretw0/agents-lab |

Additional packages found by broader `npm search pi-package` include: `@eko24ive/pi-ask`, `pi-resource-center`, `pi-exit`, `@demigodmode/pi-web-agent`, `@tungthedev/pi-extensions`, `@codersbrew/pi-tools`, `omni-pi`, `@narumitw/pi-skillforge`, `pi-subagentura`, `pi-show-diffs`, `pi-conventions`, `pi-zai-tools`, `pi-imagegen`, `@rexkit/pi-lazygit`, `pi-copy-response`, `@vanillagreen/pi-extension-manager`, `pi-git-status-line`, `pi-timer`, `pi-toasty`, `pi-edit-replace-all`, `gedpi`, `pi-figma-mcp`, `pi-git-commands-extension`, `tau-coding-agent`, `pi-thinking-level`, and `pi-beads-extension`.

## Built-in example extensions shipped with pi

These are not installed packages; they are examples in `/opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/` that can be copied/adapted.

### Tools and model-facing capabilities

- `hello.ts`: minimal custom tool
- `question.ts`, `questionnaire.ts`, `qna.ts`: structured user questions and wizards
- `todo.ts`: stateful todo tool with custom rendering
- `dynamic-tools.ts`: register tools after startup/commands
- `structured-output.ts`: final structured-output tool with `terminate: true`
- `truncated-tool.ts`: safe output truncation pattern
- `tool-override.ts`, `built-in-tool-renderer.ts`: override/wrap built-in tools/renderers
- `inline-bash.ts`, `bash-spawn-hook.ts`, `interactive-shell.ts`: shell behavior customization

### Commands and workflow

- `pirate.ts`: per-turn system-prompt modification
- `summarize.ts`: conversation summary command
- `handoff.ts`: cross-provider/model handoff
- `send-user-message.ts`: inject user messages
- `reload-runtime.ts`: reload command/tool handoff
- `shutdown-command.ts`: graceful shutdown command
- `preset.ts`: model/tool/thinking presets
- `tools.ts`: toggle active tools via UI

### Safety, permissions, and repo hygiene

- `permission-gate.ts`: confirm dangerous bash commands
- `protected-paths.ts`: block writes to protected paths
- `confirm-destructive.ts`: confirm session changes
- `dirty-repo-guard.ts`: warn before session switches/forks on dirty git repo
- `auto-commit-on-exit.ts`: commit on shutdown
- `git-checkpoint.ts`: git stash/checkpoint per turn

### Prompt/context/session customization

- `input-transform.ts`: rewrite input before agent sees it
- `claude-rules.ts`: load rules from files
- `prompt-customizer.ts`: context-aware system prompt guidance
- `system-prompt-header.ts`: display system prompt information
- `custom-compaction.ts`, `trigger-compact.ts`: compaction behavior
- `session-name.ts`, `bookmark.ts`: session names and tree labels
- `file-trigger.ts`: file watcher that triggers messages

### UI comfort

- `status-line.ts`, `model-status.ts`: footer status info
- `working-indicator.ts`, `working-message-test.ts`: thinking/working indicator customization
- `custom-footer.ts`, `custom-header.ts`, `titlebar-spinner.ts`: header/footer/title customization
- `github-issue-autocomplete.ts`: custom autocomplete provider
- `modal-editor.ts`, `rainbow-editor.ts`, `border-status-editor.ts`: custom editors/editor styling
- `widget-placement.ts`: widgets above/below editor
- `overlay-test.ts`, `overlay-qa-tests.ts`: overlay components
- `notify.ts`, `timed-confirm.ts`: notifications and timed confirmations
- `mac-system-theme.ts`, `hidden-thinking-label.ts`, `minimal-mode.ts`: theme/minimal display behavior

### Larger patterns

- `plan-mode/`: full plan mode implementation
- `subagent/`: spawn subagents
- `sandbox/`: sandboxed tool execution
- `ssh.ts`: remote execution via SSH
- `custom-provider-anthropic/`, `custom-provider-gitlab-duo/`: provider integrations
- `message-renderer.ts`: custom message rendering
- `event-bus.ts`: inter-extension events
- Games while waiting: `snake.ts`, `space-invaders.ts`, `tic-tac-toe.ts`, `doom-overlay/`

## Core pi configuration points

### Settings files

- Global: `~/.pi/agent/settings.json`
- Project override: `.pi/settings.json`
- Project settings override global settings; nested objects are merged.

Main settings:

| Area | Settings |
|---|---|
| Model/thinking | `defaultProvider`, `defaultModel`, `defaultThinkingLevel`, `hideThinkingBlock`, `thinkingBudgets` |
| UI/display | `theme`, `quietStartup`, `collapseChangelog`, `doubleEscapeAction`, `treeFilterMode`, `editorPaddingX`, `autocompleteMaxVisible`, `showHardwareCursor` |
| Telemetry/update | `enableInstallTelemetry`; env: `PI_SKIP_VERSION_CHECK`, `PI_TELEMETRY`, `PI_OFFLINE` |
| Warnings | `warnings.anthropicExtraUsage` |
| Compaction | `compaction.enabled`, `compaction.reserveTokens`, `compaction.keepRecentTokens` |
| Branch summaries | `branchSummary.reserveTokens`, `branchSummary.skipPrompt` |
| Retry | `retry.enabled`, `retry.maxRetries`, `retry.baseDelayMs`, `retry.provider.timeoutMs`, `retry.provider.maxRetries`, `retry.provider.maxRetryDelayMs` |
| Message queue | `steeringMode`, `followUpMode` (`one-at-a-time` or `all`) |
| Provider transport | `transport` (`sse`, `websocket`, `auto`) |
| Terminal/images | `terminal.showImages`, `terminal.imageWidthCells`, `terminal.clearOnShrink`, `images.autoResize`, `images.blockImages` |
| Shell/package manager | `shellPath`, `shellCommandPrefix`, `npmCommand` |
| Sessions | `sessionDir` |
| Model cycling | `enabledModels` |
| Markdown | `markdown.codeBlockIndent` |
| Resources | `packages`, `extensions`, `skills`, `prompts`, `themes`, `enableSkillCommands` |

### Keybindings

File: `~/.pi/agent/keybindings.json`. Run `/reload` after editing.

Customizable areas:

- Editor movement/deletion/yank/undo
- Input submit/newline/tab/autocomplete
- Selection list navigation
- App actions: interrupt, clear, exit, suspend, external editor, paste image
- Sessions: new/tree/fork/resume, rename/delete/sort/filter
- Model and thinking: model selector/cycle, thinking cycle/toggle
- Display: collapse tools, follow-up/dequeue queued messages
- Tree navigation/filtering
- Scoped model selector controls

Useful defaults:

- `Ctrl+L`: model selector
- `Ctrl+P` / `Shift+Ctrl+P`: cycle scoped models
- `Shift+Tab`: cycle thinking level
- `Ctrl+O`: expand/collapse tool output
- `Ctrl+T`: expand/collapse thinking blocks
- `Alt+Enter`: queue follow-up message
- `Alt+Up`: restore queued messages to editor
- `Ctrl+G`: external editor (`$VISUAL` or `$EDITOR`)

### Themes

Built-ins: `dark`, `light`.

Custom themes are JSON files with 51 required color tokens covering:

- Core UI: accent, borders, status colors, muted/dim/text
- Backgrounds: selected/user/custom/tool backgrounds
- Markdown: headings, links, code, blockquote, rules, bullets
- Tool diffs: added/removed/context
- Syntax highlighting tokens
- Thinking-level editor border colors
- Bash-mode color

Optional HTML export colors: `export.pageBg`, `export.cardBg`, `export.infoBg`.

### Prompt templates

Markdown files invoked as slash commands by filename, e.g. `review.md` => `/review`.

Frontmatter supports:

- `description`
- `argument-hint`

Template arguments:

- `$1`, `$2`, ...
- `$@` or `$ARGUMENTS`
- `${@:N}` and `${@:N:L}`

### Skills

Agent Skills-compatible `SKILL.md` folders or top-level `.md` files in supported locations.

Frontmatter:

- Required: `name`, `description`
- Optional: `license`, `compatibility`, `metadata`, `allowed-tools`, `disable-model-invocation`

Invocation:

- Automatic, based on skill descriptions in the system prompt
- Manual: `/skill:name [args]`

### Models/providers

File: `~/.pi/agent/models.json`.

Can add local/proxy providers such as Ollama, LM Studio, vLLM, OpenAI-compatible proxies, Anthropic-compatible proxies, Google AI Studio, etc.

Provider fields include:

- `baseUrl`, `api`, `apiKey`, `headers`, `authHeader`
- `models`, `modelOverrides`
- compatibility settings such as `supportsDeveloperRole`, `supportsReasoningEffort`, `supportsUsageInStreaming`, `maxTokensField`, `thinkingFormat`, `cacheControlFormat`, provider routing preferences

Model fields include:

- `id`, `name`, `api`, `reasoning`, `thinkingLevelMap`, `input`, `contextWindow`, `maxTokens`, `cost`, `compat`

Extensions can also call `pi.registerProvider()` for dynamic providers and OAuth/SSO providers.

### Context and system prompt files

- `AGENTS.md` / `CLAUDE.md`: loaded from global, cwd, and ancestor directories.
- `SYSTEM.md`: replaces default system prompt.
- `APPEND_SYSTEM.md`: appends to default system prompt.
- CLI: `--no-context-files`, `--system-prompt`, `--append-system-prompt`.

### CLI/session/tool flags

Common comfort-related flags:

- `--models "claude-*,gpt-4o"`: scoped model cycling list
- `--thinking high`: startup thinking level
- `--tools read,grep,find,ls`: read-only-ish mode
- `--no-builtin-tools`, `--no-tools`: tool control
- `--no-extensions`, `--no-skills`, `--no-prompt-templates`, `--no-themes`: disable discovery
- `--no-context-files`: ignore AGENTS/CLAUDE context
- `--session-dir <dir>`, `--no-session`, `--session <path|id>`, `--fork <path|id>`
- `--offline`: disables startup network operations

### Environment variables

- `PI_CODING_AGENT_DIR`: config directory override
- `PI_CODING_AGENT_SESSION_DIR`: session directory override
- `PI_PACKAGE_DIR`: package directory override
- `PI_OFFLINE`: disable startup network ops
- `PI_SKIP_VERSION_CHECK`: skip version check
- `PI_TELEMETRY`: install/update telemetry override
- `PI_CACHE_RETENTION=long`: longer prompt cache when supported
- `VISUAL`, `EDITOR`: external editor for `Ctrl+G`

## What custom extensions can change

Extensions can register or modify:

- Custom tools, including overriding built-ins (`read`, `bash`, `edit`, `write`, `grep`, `find`, `ls`)
- Slash commands
- Keyboard shortcuts
- CLI flags
- Model providers/OAuth/custom streaming APIs
- Active tools, model, thinking level
- Session names and `/tree` labels
- System prompt/context before agent start
- Provider request/response payloads
- Tool calls/results, including permission gates and path protection
- User input transforms
- User `!`/`!!` bash behavior
- Compaction and branch summaries
- UI: dialogs, notifications, status lines, widgets, custom footer/header, terminal title, editor text, autocomplete providers, custom editor, overlays, custom message/tool renderers
- Persistent extension state via session entries or tool-result details

Important extension events:

- Lifecycle/resources: `session_start`, `resources_discover`, `session_shutdown`
- Input/agent: `input`, `before_agent_start`, `agent_start`, `agent_end`, `turn_start`, `turn_end`, `context`
- Provider: `before_provider_request`, `after_provider_response`
- Messages/tools: `message_start`, `message_update`, `message_end`, `tool_execution_start`, `tool_call`, `tool_result`, `tool_execution_update`, `tool_execution_end`
- Sessions: `session_before_switch`, `session_before_fork`, `session_before_compact`, `session_compact`, `session_before_tree`, `session_tree`
- Model: `model_select`, `thinking_level_select`
- User shell: `user_bash`

## Friction-to-solution map for later

When describing pain points, map them to these likely solution surfaces:

| Friction type | Likely existing/custom solution |
|---|---|
| Too much tool noise | settings/keybinding, `pi-tool-display`, custom renderers, `hideThinkingBlock`, `Ctrl+O`/`Ctrl+T` |
| Unsafe actions / permission prompts | `@gotgenes/pi-permission-system`, `pi-show-diffs`, custom `tool_call` gate |
| Wants Claude Code-like UX | `pi-claude-style-tools`, custom footer/header/tool renderers, themes |
| Needs web/search/browser | `pi-web-access`, `@feniix/pi-exa`, `@juicesharp/rpiv-web-tools`, `pi-agent-browser-native`, custom tools |
| Needs subagents / parallel work | `pi-subagents`, `pi-crew`, `taskplane`, `pi-messenger-swarm`, custom subagent extension |
| Needs planning/spec mode | `pi-gsd`, `@feniix/pi-specdocs`, `@plannotator/pi-extension`, built-in `plan-mode` example |
| Needs memory | `@samfp/pi-memory`, `pi-hermes-memory`, `pi-memctx`, `pi-memory-md`, skills/context files |
| Needs better sessions/search | `@kaiserlich-dev/pi-session-search`, `/tree`, labels/bookmarks, custom session tools |
| Needs custom keyboard/editor behavior | keybindings, custom editor extension, external editor (`Ctrl+G`) |
| Needs less context/token waste | compaction settings, `pi-lean-ctx`, `context-mode`, custom compaction |
| Needs model/provider routing | `models.json`, provider packages, custom provider extension |
| Needs visual/theme comfort | themes, `@ifi/oh-pi-themes`, `amp-themes`, custom footer/status/widgets |
