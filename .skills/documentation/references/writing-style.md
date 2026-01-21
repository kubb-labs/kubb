# Writing Style

Sentence structure, voice, tone, and paragraph patterns for the Kubb ecosystem documentation.

## Guiding principle, Clarity over marketing

Prefer direct, concrete, technical language over marketing phrasing. Be specific about what the code does and how to use it.

- Direct and technical: avoid marketing adjectives such as "powerful", "amazing", or "seamless".
- Concrete over abstract: prefer "Generates TypeScript types from OpenAPI schemas" over "Transforms your API into typed code".
- Short paragraphs: 1–3 sentences per paragraph.
- Avoid nominalizations (turning verbs into nouns like "the creation of").
- Use consistent terminology across pages: choose `plugin`, `schema`, `endpoint`, etc., and stick to it.
- Use backticks for commands, config keys, filenames, and API identifiers.

## Structure: What → Why → When → How

When describing a feature, option, or example use this short structure:

1. What — short description of the feature or option.
2. Why — the problem it solves or the primary use case (optional if obvious).
3. When — when to use it versus alternatives (optional).
4. How — a minimal, working example demonstrating usage.

## Sentence Patterns

Kubb documentation prefers short, subject-first sentences that state behavior or intent clearly. Aim for sentences under ~20–25 words and favor present tense and active voice.

### Subject-First Declarative (60%)

Use to describe what the product, module, or plugin does. Keep the subject first and follow with a concise verb phrase.

```
The kubb plugin generates TypeScript types from an OpenAPI schema.
The parser validates schema types during build.
```

### Imperative Instructions (25%)

Use for step-by-step commands or quick actions. Start with a verb and keep the object direct.

```
Run `pnpm changeset` to create a changeset.
Add the plugin to `kubb.config.ts` and configure `pluginOas`.
```

### Contextual Openers (15%)

Use when you need to signal a prerequisite, conditional, or sequence. Begin with words like `When`, `If`, `During`, or `After`.

```
When using authentication, configure the session handler.
After installing the module, restart the server.
```

## Voice

### Active Voice (85%)

Subject performs action. Prefer this.

| Active (use)                    | Passive (avoid)                       |
|---------------------------------|---------------------------------------|
| The module creates a connection | A connection is created by the module |
| You can override defaults       | Defaults can be overridden            |
| Kubb handles Swagger validation | Swagger Validation is handled by Kubb |

### When Passive is OK (15%)

- Actor unknown: "The file is loaded during startup."
- Object more important: "Data is cached for 5 minutes."
- System behavior: "Types are generated based on the OpenAPI spec file."

## Tense

**Present (90%)**: Instructions and behavior
**Future (5%)**: Consequences ("This will create an endpoint")
**Past (5%)**: Changelogs only

## Modal Verbs

| Verb     | Meaning           | Example                          |
| -------- | ----------------- | -------------------------------- |
| `can`    | Optional (40%)    | "You can customize colors."      |
| `should` | Recommended (30%) | "You should validate input."     |
| `may`    | Possibility (20%) | "This may cause issues."         |
| `must`   | Required (10%)    | "You must install dependencies." |

Avoid weak modals: `might`, `could`, `would`

## Direct Address

**Guides/tutorials**: Use "you" (70% of content)
**API references**: Neutral voice, no "you"

Stay consistent within sections.

## Paragraphs

**Length**: 1–3 sentences per paragraph
**Structure**: Topic sentence first, then supporting detail

## Opening Sentences

### Page Openings

Define what it is, its purpose, key benefits:

```
The Kubb CLI offers an easy way to monitor generation progress by invoking the core `build` command and showcasing its events in real time.
```

Avoid: "This page describes...", "In this guide...", "Let's explore..."

### Section Openings

Introduce topic and why it matters:

```
## Configuration

The plugin accepts several options that control its behavior.
```

## Tone by Content Type

| Type            | Tone                         |
| --------------- | ---------------------------- |
| Getting Started | Welcoming, encouraging       |
| Guides          | Instructional, supportive    |
| API Reference   | Precise, neutral             |
| Troubleshooting | Empathetic, solution-focused |

## Word Choice

| Avoid           | Use         |
| --------------- | ----------- |
| utilize         | use         |
| implement       | add, create |
| leverage        | use         |
| in order to     | to          |
| due to the fact | because     |

## Common Mistakes

- Starting with "It" or "This" (unclear antecedent)
- Stacking prepositions ("the value of the property of the config")
- Overusing "Note that" (just state the fact)
- Burying important info at end of long sentences

## Examples

Examples must be practical and usable:

- Realistic: use actual OpenAPI or code snippets, not placeholders.
- Complete: include all required configuration so the example is runnable.
- Tested: verify examples work before committing them.
- Minimal: show only what's necessary to understand the feature.
