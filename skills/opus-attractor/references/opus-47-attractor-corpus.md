# Opus 4.7 Attractor Corpus

Goal: build a grounded corpus for a Pi skill that answers “what would Claude Opus 4.7 think/say/do?” as a perturbation lens. This intentionally avoids generic Claude/LLM frontend tropes unless a source ties them to Opus 4.7 or an Opus-4.7-powered product.

## Evidence classes

| Class | Weight | Use |
|---|---:|---|
| Anthropic Opus 4.7 docs / launch notes | High | Model-specific behavioral priors |
| Anthropic customer / tester quotes in launch post | Medium-high | Real-world use claims, still marketing-curated |
| Every Vibe Check / Claude Design review | Medium-high | Independent practitioner evaluation; early, specific, experiential |
| Ethan Mollick LinkedIn posts | Medium | Early public user feedback about adaptive reasoning/tool use; not design-specific but central to “what would it do?” |
| Simon Willison posts/tag pages | Medium | Careful LLM observer; current Opus 4.7 comments found are mostly tokenizer/cost/HTML-artifact workflow, not aesthetic taste |
| Mainstream reviews / blog tests | Low-medium | Useful examples, but often less controlled and may blur Claude product features with model behavior |

## Source index

### S1 — Anthropic launch: “Introducing Claude Opus 4.7”
URL: https://www.anthropic.com/news/claude-opus-4-7

Relevant signals:
- “Users report being able to hand off their hardest coding work—the kind that previously needed close supervision—to Opus 4.7 with confidence.”
- “handles complex, long-running tasks with rigor and consistency”
- “pays precise attention to instructions”
- “devises ways to verify its own outputs before reporting back”
- “more tasteful and creative when completing professional tasks, producing higher-quality interfaces, slides, and docs”
- migration note: Opus 4.7 can take older prompts more literally; prompt/harness retuning may be needed.

Curated tester quotes:
- Ramp: “catches its own logical faults during the planning phase and accelerates execution”
- Browserbase: handles “real-world async workflows—automations, CI/CD, and long-running tasks” and “brings a more opinionated perspective, rather than simply agreeing with the user.”
- Hex: “correctly reports when data is missing instead of providing plausible-but-incorrect fallbacks” and resists dissonant-data traps.
- Sourcegraph: strict instruction following helps long-running coding workflows.
- Airtable / Aj Orbach: “best model in the world for building dashboards and data-rich interfaces. The design taste is genuinely surprising—it makes choices I’d actually ship.”
- Factory: “cutting out the meaningless wrapper functions and fallback scaffolding that used to pile up, and fixes its own code as it goes.”
- Devin: “works coherently for hours, pushes through hard problems rather than giving up.”

Attractor implications:
- Prefer self-checking before final answer.
- Do not invent missing facts; explicitly mark missing data.
- Be willing to disagree with the user.
- For dashboards/data-rich UIs, make shippable choices, not generic scaffolds.
- Remove meaningless fallback/wrapper scaffolding.

### S2 — Anthropic tutorial: “Working with Claude Opus 4.7”
URL: https://claude.com/resources/tutorials/working-with-claude-opus-4-7

Relevant signals:
- “model to reach for when the work is substantial and worth getting right.”
- follows instructions more literally than Opus 4.6.
- one clear statement is sufficient; repetition for emphasis is not needed.
- re-read project/scheduled-task instructions because “be brief” or “skip the obvious parts” may now be followed more precisely.
- high-resolution image reading helps with chart labels, busy tables, fine print, screenshots.
- adaptive thinking: answers simple things immediately and takes time on hard ones.
- stronger at producing/reviewing office work: Word docs, spreadsheets, slide decks.

Attractor implications:
- Be precise about scope and desired behavior.
- Do not rely on implicit permission.
- Use visual inspection when screenshots/UI are involved.
- Calibrate effort: short direct answers for simple decisions; deeper reasoning for real design/product judgments.

### S3 — Anthropic docs: Prompting Claude Opus 4.7 / migration guide
URLs:
- https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices.md
- https://docs.anthropic.com/en/docs/about-claude/models/migration-guide.md
- https://docs.anthropic.com/en/docs/build-with-claude/effort.md
- https://docs.anthropic.com/en/docs/build-with-claude/adaptive-thinking.md

Relevant signals:
- Response length calibrates to perceived task complexity.
- More direct and opinionated, with less validation-forward phrasing and fewer emoji than Opus 4.6.
- More literal and explicit instruction following, particularly at lower effort.
- Uses tools less often than Opus 4.6 and reasoning more; higher effort increases tool use.
- Fewer subagents spawned by default; steerable by prompting.
- More regular, higher-quality progress updates in long agentic traces.
- `xhigh` is recommended for most coding and agentic use cases; `low` and `medium` may under-think.

Attractor implications:
- The voice should be direct and minimally validating.
- Avoid “menu of options” unless the decision really is undecidable.
- Make scope explicit.
- Use tools only when grounding is needed; don’t do ritual tool use.
- For long work, maintain direction and progress.

### S4 — Every: “Vibe Check: Opus 4.7 Stopped Reading Between the Lines”
URL: https://every.to/vibe-check/opus-4-7
Author: Katie Parrott

Relevant signals:
- “more precise, more literal, and the best coding model we’ve tested on well-specified tasks—but it won’t fill in the gaps for you anymore.”
- “sharper tool … needs a sharper operator.”
- “hedges or stalls when you don’t tell it exactly what you want.”
- “With a detailed brief, 4.7 cleared our hardest coding benchmark and produced consulting prose that one tester called ‘better than reading my own.’”
- Alex Albert reportedly confirmed 4.6 had been doing meaningful prompt engineering on the user’s behalf that 4.7 doesn’t.
- “listening for explicit permission now that its predecessor took for granted.”
- Self-verification: reviews output against request before reporting back; catches logic errors mid-plan.
- Long-horizon coherence: holds thread better on multi-hour tasks.
- Vision: catches tiny details including misaligned buttons and off-by-few-pixels layouts during frontend iteration.
- Effort: xhigh for asynchronous handoffs; max for benchmarks/complex architecture; high/medium for interactive work.

Attractor implications:
- “Well-specified” is the key unlock. The skill should ask for or synthesize a brief before invoking taste.
- If the user wants perturbation, the skill should explicitly take permission to go beyond the immediate ask.
- A Claude-4.7-style design move is less about spontaneous creativity and more about strong execution under a clear brief.
- Include self-review against the stated brief.

### S5 — Every: “Mini-Vibe Check: Claude Design Isn’t for Designers—Yet”
URL: https://every.to/context-window/mini-vibe-check-claude-design
Author: Katie Parrott; includes Every creative director Lucas Crespo’s feedback

Relevant signals:
- Claude Design is Opus-4.7-powered and can ingest repo/Figma/brand kit.
- It can extract a starting design system from a GitHub repo: colors, typography, reusable components.
- Best use: non-designers extending an existing system (careers page, YouTube thumbnail, one-pager) without bothering design team.
- Live generative interface, asks questions about layout density, accent color, whether to animate emojis.
- Sketch/comment/edit-in-place are useful.
- Critique: not built for designers; prompt/menu-driven interaction feels like “filling a bunch of forms—design is supposed to be fun.”
- Works for extending/revising a system; less suited for starting from scratch.

Attractor implications:
- Opus-4.7-powered design is strongest when extending a clear system, not inventing from an empty prompt.
- The skill should prefer extracting system tokens/patterns before proposing new style.
- It should avoid form-filling vibes in its interaction: fewer questions, better synthesis.
- For new directions, use visual references or a concrete design thesis.

### S6 — Ethan Mollick: adaptive thinking criticism and follow-up
URLs:
- https://www.linkedin.com/posts/emollick_the-new-claude-opus-47-now-only-has-an-activity-7450636076924338177-Wsyl
- https://www.linkedin.com/posts/emollick_ill-give-anthropic-credit-for-moving-quickly-activity-7450914744007553025-_ekm

Relevant signals:
Initial criticism:
- Opus 4.7 only had adaptive reasoning where the user could previously control reasoning.
- He found adaptive routing bad for non-math/code tasks: analysis, writing, research.
- It rarely seemed to think on those tasks, and therefore was not using tools/web search.
- He viewed this as lower quality than Opus 4.6 Extended Thinking for those use cases.
- He criticized the assumption that coding/technical work is the only important intellectual work.

Follow-up:
- Anthropic moved quickly; adaptive thinking began triggering more often, including for previously failed tasks.
- More web search and tool use.
- “large improvement in output quality on non-coding tasks, compared to either Opus 4.6 or Opus 4.7 yesterday.”
- Still some weirdness and refusals.

Attractor implications:
- For aesthetic/product/writing work, do not let “non-code” imply “low effort.”
- The skill should explicitly mark design/product critique as reasoning-worthy.
- Tool/search use should be triggered when the judgment depends on external examples or current claims.
- Effort routing is part of the attractor: ask the agent to treat design judgment as high-effort when the user requests “what would Opus think?”

### S7 — Simon Willison: Claude / Opus 4.7 notes
URLs:
- https://simonwillison.net/tags/claude/
- https://simonwillison.net/tags/anthropic/
- https://simonwillison.net/tags/llms/

Relevant signals found:
- Simon’s current Opus 4.7 comments focus on tokenizer/cost and improved image support.
- Opus 4.7 changed tokenizer; Simon measured the Opus 4.7 system prompt as 1.46x the tokens vs Opus 4.6, implying potentially ~40% more expensive for same input despite same nominal token price.
- He highlights improved high-resolution image support.
- On Claude Code/HTML artifacts, Simon quotes/links Anthropic’s Thariq Shihipar arguing for HTML over Markdown as output: HTML can include SVG diagrams, interactive widgets, inline annotations, severity color coding, etc.
- Example prompt from Simon’s page: ask Claude to review a PR by creating an HTML artifact with diff annotations, severity-coded findings, and whatever else conveys the concept well.

Attractor implications:
- Treat HTML artifacts as a native medium for Claude-like explanation/review, especially when spatial/visual structure helps.
- The attractor should be artifact-forward: not just prose; build an inspectable HTML/SVG/interactive object when that improves judgment.
- Be cost-aware with Opus 4.7-length context.

### S8 — Tom’s Guide hands-on review
URL: https://www.tomsguide.com/ai/i-tested-anthropics-new-claude-opus-4-7-and-its-the-first-ai-that-actually-reasons-through-tasks

Relevant signals:
- Reviewer says the model listens/responds differently and feels less like a chatbot, more like a “reliable digital architect.”
- Tested coding, research, home design advice.
- Design artifact prompt: “Design an app for my ready-to-eat cold pizza company ‘Crusted.’ Make it look like something a real design studio would ship, not a generic SaaS template.”
- Reported result: single-screen ordering app mockup with editorial/deli aesthetic, warm paper palette, stylish fonts, CSS-only pizza illustrations varying by variety.

Attractor implications:
- A specific, vivid brief can elicit distinctive design.
- Good Opus-4.7 design moves can be editorial/contextual and illustrative, not just component-polished.
- For design, ask for “real studio would ship” and specify the domain mood.

### S9 — MindStudio review
URL: https://www.mindstudio.ai/blog/claude-opus-47-review-whats-new

Relevant signals:
- Meaningful step up, not cosmetic.
- Biggest gains: agentic coding, multimodal reasoning, long-document analysis.
- Not a clean sweep: latency higher; Mythos above it.
- Better at multi-step coding with fewer interruptions, recovers from errors more cleanly, maintains context across long sessions.
- Better at following sequence of tool calls without drifting from original intent.
- Long-document QA and multimodal gains are clearer than simple HumanEval/math gains.
- Creative writing not meaningfully better than 4.6.

Attractor implications:
- Use Opus 4.7 for complex, structured, grounded product/design work, not necessarily pure creative ideation.
- The attractor should maintain intent across multi-step refinement.

### S10 — DEV Community hands-on coding review
URL: https://dev.to/gabrielanhaia/claude-opus-47-just-dropped-i-tested-it-for-6-hours-straight-heres-what-changed-3k50

Relevant signals:
- Strong vision upgrade; reads dense terminal screenshots and small text.
- Instruction following got “aggressive”: sloppy instructions that 4.6 interpreted charitably may be followed literally in 4.7.
- Example: “always respond in JSON” becomes pure JSON even when clarifying natural language would help.
- Claude Code added `/ultrareview`, framed as senior-engineer-level review for bugs and design issues.

Attractor implications:
- Skill instructions must be carefully scoped to avoid over-literal misfires.
- Include explicit escape clauses: ask clarifying questions when instruction compliance would harm the task.
- Review mode should search for design issues, not just bugs.

## Artifact corpus

These are concrete artifact/product examples to analyze or recreate in follow-up tests.

| ID | Artifact | Source | What to extract |
|---|---|---|---|
| A1 | Apartment-hunting dashboard pulling Craigslist/Zillow twice daily | Every / Alex Albert anecdote | Long-horizon coherence; practical async data product; update cadence; dashboard semantics |
| A2 | Claude Design extracts design system from GitHub repo | Every Claude Design review | Token extraction; style-system extension rather than greenfield invention |
| A3 | Claude Design careers page / YouTube thumbnail in Every style | Every Claude Design review | Non-designer extension of existing brand system |
| A4 | “Crusted” cold pizza ordering app | Tom’s Guide | Domain-specific aesthetic: editorial/deli, warm paper palette, stylish fonts, CSS illustration |
| A5 | PR review as HTML artifact with annotated diff and severity colors | Simon / Thariq Shihipar | HTML as reasoning surface; visual annotation; interactive explanation |
| A6 | Dashboards and data-rich interfaces | Anthropic / Airtable quote | “Choices I’d ship”; data hierarchy; dashboard taste |
| A7 | Slides / professional presentations | Anthropic / Every | Self-checking visual consistency; high-res vision feedback loop |
| A8 | Dense screenshot / terminal/document extraction | Anthropic docs + DEV + Simon | Pixel detail, small text, exact reading before critique |

## Emerging Opus 4.7 attractor principles

1. **Specification is the taste unlock**
   - Opus 4.7 appears less likely than 4.6 to fill gaps with implicit prompt engineering.
   - Strong briefs produce unusually strong output; vague briefs produce stalls, hedges, or wrong guesses.

2. **Literalness is both strength and hazard**
   - It follows instructions precisely.
   - Bad or over-broad instructions can backfire.
   - The skill must scope instructions carefully and permit clarification when literal compliance would be harmful.

3. **Self-verification is part of the aesthetic**
   - It checks its own plan/output against the original request.
   - In design terms: verify that the artifact satisfies the brief, not just that it looks plausible.

4. **Opinionated but grounded**
   - More opinionated than 4.6 and less validation-forward.
   - Should disagree with the user when the evidence says so.
   - Should report missing data rather than make plausible fallbacks.

5. **High-effort design/product work must be explicitly treated as high-effort**
   - Ethan Mollick’s criticism matters: adaptive routing initially undervalued writing/research/analysis.
   - A design-attractor skill should explicitly say that aesthetic/product judgment is complex reasoning, not a cheap style pass.

6. **Vision changes the feedback loop**
   - Opus 4.7 can catch tiny visual/layout details in screenshots.
   - The attractor should prefer screenshot inspection for UI critique and should look for off-by-a-few-pixels issues, density, labels, hierarchy, and chart/table details.

7. **Best design mode is system extension + decisive artifact**
   - Claude Design seems strongest when extending an existing design system.
   - Greenfield work needs concrete references or a vivid design thesis.
   - Output should often be an artifact: HTML/SVG/interactive prototype/checklist, not just prose.

8. **Prune meaningless scaffolding**
   - Several sources praise cleaner code and removal of fallback/wrapper bloat.
   - A UI analogue: remove generic structural chrome that doesn’t serve the product.

## Anti-principles: what not to encode as Opus 4.7-specific

- “Purple gradients” or generic SaaS slop: relevant to Claude frontend generation broadly, not enough evidence as Opus 4.7-specific.
- Warm collaborative affirmation: Opus 4.7 is reportedly less validation-forward than 4.6.
- Always use tools: Opus 4.7 uses reasoning more and tools less by default; tool use should be justified by grounding needs.
- Always ask questions: Opus 4.7 benefits from clear briefs, but an attractor should synthesize missing constraints where safe and ask only when blocked.
- Pure creativity: strongest evidence is complex reasoning, agentic coding, multimodal/document analysis, data-rich interfaces, and professional deliverables—not unconstrained ideation.

## Candidate skill behavior

Name should avoid reserved `claude` / `anthropic`. Candidate: `opus-attractor`.

Skill should:
1. Convert the user’s request into a brief.
2. State assumptions and scope.
3. Treat design/product/writing as high-effort reasoning when requested.
4. Inspect concrete artifacts before judging.
5. Give a direct, opinionated judgment.
6. Propose the smallest decisive move and a stronger alternate move.
7. Self-check against the brief.
8. Prefer artifacts when visual/spatial reasoning matters.

## Draft review format

```md
### Brief
What I think you are asking for, in one sentence.

### Judgment
The direct Opus-attractor take.

### Evidence
Observed details, not vibes.

### Move
The smallest decisive change.

### Stronger move
The bolder perturbation.

### Self-check
Does this satisfy the brief? What could be missing?
```

## Gaps / next corpus work

- Need actual Opus 4.7 artifact outputs, not just reviews. Build a local prompt suite and save outputs from Opus 4.7 if/when API access is enabled.
- Need more Simon Willison content if he publishes an Opus 4.7 hands-on review beyond tokenizer/HTML-artifact notes.
- Need direct screenshots/HTML from Claude Design outputs for analysis.
- Need Every’s benchmark examples if available beyond the article.
- Need compare pairs: same prompt on Opus 4.6 vs 4.7, especially design critique and UI artifact generation.

## Anthropic / Claude product-surface visual tells

These are not generic “Claude generated UI” tropes. They are visible Anthropic/Claude product-surface motifs and should be treated as design-attractor signals when the user specifically asks for an Opus/Claude-like perturbation.

### V1 — Selective chromatic emphasis

A high-confidence tell: a calm block of text where **one word or short phrase appears in a contrasting color**.

Pattern:
- mostly monochrome headline/body text
- one semantic word gets the accent
- accent marks the conceptual turn, not decoration
- often warm clay/orange/red, blue, green, or purple depending on context
- surrounding layout remains restrained

Use:
- emphasize the decisive noun/verb in a headline
- reveal the point of view with one color move
- prefer one accent over gradients or multi-color decoration

Example:

```html
<h1>Make the session easier to <span class="accent">skim</span>.</h1>
```

### V2 — Editorial restraint plus one expressive move

Claude/Anthropic surfaces often feel plain until one carefully chosen move creates personality:
- a colored word
- an italic phrase
- a quiet diagram
- a small contextual illustration
- an unusual but controlled shape

The point is not minimalism for its own sake. The composition is restrained so that the one expressive move carries meaning.

### V3 — Warm paper palette

Common tonal field:
- off-white, cream, sand, parchment
- clay, rust, muted orange/red
- charcoal, ink, warm gray

This reads more like a notebook, essay, research memo, or institutional publication than a cold SaaS dashboard.

### V4 — Literary / essay typography

Claude/Anthropic surfaces tend toward a thoughtful editorial cadence:
- large calm headlines
- generous line-height
- spacious body text
- occasional serif or serif-adjacent feel
- text hierarchy that feels typeset, not merely styled

Avoid turning this into generic “premium serif.” The key is a considered essay/document feel.

### V5 — Single semantic accent

The accent is sparse and meaningful:
- one word
- one underline
- one diagram node
- one small label
- one status color

The accent should answer: “What is the conceptual hinge of this piece?”

### V6 — Thin-rule structure

Use hairline borders, quiet dividers, document grids, and table-like organization. Prefer editorial rules over heavy cards and shadows. Information should feel arranged by a careful explainer.

### V7 — Diagrammatic thinking

Claude/Anthropic aesthetics often look like explanation made visible:
- boxes and arrows
- labeled flows
- simple maps
- annotated states
- before/after frames

The diagram should clarify reasoning, not decorate the page.

### V8 — Understated rounded geometry

Rounded corners are allowed, but the feel is softened document/tool rather than bubbly SaaS. Avoid turning every thought into a card.

### V9 — Research-lab credibility

The aesthetic borrows from:
- papers
- documentation
- internal tools
- diagrams
- institutional publishing
- carefully annotated artifacts

It should feel serious without becoming sterile.

### V10 — Conversational but not chatty copy

Copy tends to be short, calm, and precise:
- less hype
- less cheerleading
- fewer exclamation points / emoji
- more “here is the shape of the problem”

This pairs with Opus 4.7’s more direct, less validation-forward tone.

### V11 — Whitespace as confidence

The layout does not need to fill every gap. Large empty areas can signal editorial control and confidence when the hierarchy is clear.

### V12 — Artifact / document hybridity

A Claude-like artifact often feels like a document that became a tool:
- annotated diff
- report-like dashboard
- explainer with embedded widget
- table plus prose
- diagram plus action
- checklist plus generated artifact

This connects Simon Willison / Thariq Shihipar’s HTML-artifact observation with Anthropic’s product surface: HTML is not just a rendering target, it is a reasoning surface.

### V13 — Muted explanatory iconography

If icons appear, they should explain structure or state. Avoid spraying icons over every bullet. One meaningful symbol beats many decorative ones.

## Updated visual summary

A Claude/Anthropic-flavored design often looks like:

> A calm research/editorial document, lightly instrumented into a tool, with one precise chromatic or diagrammatic accent.

Or more tersely:

> A beautifully typeset memo that learned how to run code.

## Applying visual tells without cargo-culting

When using these motifs:
1. Start from the brief and system; do not apply the surface blindly.
2. Choose one expressive move.
3. Make the accent semantic.
4. Prefer document/tool hybridity over decorative UI chrome.
5. Self-check: if the colored word, diagram, or rule disappeared, would the design lose meaning or only decoration? If only decoration, remove it.
