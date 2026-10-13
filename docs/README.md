# Kubb docs

The hand-written Kubb core docs. [kubb.dev](https://kubb.dev) renders `5.x/` at `https://kubb.dev/docs/5.x/` from this repository's `main` branch, so a merged change goes live on the next kubb.dev deploy.

| Folder | Holds |
| --- | --- |
| `5.x/` | The v5 pages, one [Diátaxis](https://diataxis.fr) quadrant per folder: `tutorials/`, `how-to/`, `reference/`, and `explanation/`, plus `integrations/`, `ai/`, `community/`, and `resources/` |
| `snippets/` | Text that several pages include with `<!--@include: ../../snippets/...-->`, a path relative to the including page |

Docs for plugins, adapters, and parsers do not live here. Each extension ships them in its own package, in `packages/<name>/docs/` here or in [kubb-labs/plugins](https://github.com/kubb-labs/plugins). Link to an official extension as `/extensions/kubb-labs/<slug>`, such as `/extensions/kubb-labs/plugin-ts/options`. [Extension docs](5.x/reference/kit/extension-docs.md) has the full rules.

Blog posts live in [kubb-labs/platform](https://github.com/kubb-labs/platform) under `apps/kubb.dev/content/blog/`.

## Change the docs

Update the docs in the same pull request as the code they describe. A docs-only pull request needs no changeset, and CI skips it.

`5.x/changelog.md` is written by hand. In each release, add a short entry per version from the root `CHANGELOG.md`: one line per user-facing change with its PR link. Leave out internal-only changes.

To preview a change, run kubb.dev from a [kubb-labs/platform](https://github.com/kubb-labs/platform) checkout against this checkout:

```shell
pnpm --filter kubb.dev fetch:local --docs <path-to-this-kubb-checkout>
pnpm --filter kubb.dev dev
```

## Sidebar

The `5.x` sidebar is built from the files in this folder. A page shows up when its frontmatter sets `order`, its position among the pages in the same folder. Add `navigation.title` when the sidebar label should differ from the page `title`:

```yaml
---
title: Basic Usage
order: 3
navigation:
  title: Getting started
---
```

A folder gets its title, icon and position from a `.navigation.yml` file inside it, such as `title: Guide`, `icon: i-iconoir-book-stack` and `order: 2`. Pages and folders without `order`, like the changelog, stay out of the sidebar. A page that has a folder of the same name (`reference/kit.md` and `reference/kit/`) becomes the group and gets an "Overview" link to itself.

## Writing guidelines

- Write in active voice, present tense.
- Keep paragraphs short, 2 to 3 sentences.
- Explain before showing code.
- Import `defineConfig` from `kubb/config` in every example.
- Put each page in one Diátaxis quadrant (tutorial, how-to, reference, explanation) and link to the owner page instead of repeating its content. The `snippets/` folder holds text that several pages include.

Pages render with Nuxt Content and Nuxt UI's Markdown components. Reuse the same elements for the same purpose:

| Content | Element | Authoring rule |
| --- | --- | --- |
| Comparisons and tabular reference data | Markdown table | Keep related values in columns. Escape `\|` in types. |
| Accepted enum values | `::field-group` and `:::field` | Give each accepted value its own field, using the literal value as `name`. Explain its behavior, default status, examples, and constraints in the body. Use fields instead of value comparison tables or bullet lists. |
| Individual option metadata on other reference pages | `::field-group` and `:::field` | Set `name` and `type`, and include any default in the body. Under a detail heading, set only `type` so the option name is not repeated. Add `required` only for required options. |
| Background information | `> [!NOTE]` | Use for supplementary context. |
| Recommendations | `> [!TIP]` | Use for optional improvements and useful shortcuts. |
| Requirements | `> [!IMPORTANT]` | State what the reader must do. |
| Potential problems | `> [!WARNING]` | Explain the consequence and how to avoid it. |
| Destructive actions | `> [!CAUTION]` | Explain what the action removes or changes. |
| Linked context | `::callout` | Set `to`, `icon`, and `color` when the whole callout links to another page. |
| Sequential instructions | `::steps{level="2"}` | Use an H2 for each step and keep existing anchors with `{#id}`. |
| Related guides and next steps | `::card-group` and `:::card` | Set `title` and `to`. Add a short description in the body when the title alone does not say what the page covers. |
| Alternative code examples | `::code-group` | Label every fence. Use `sync="package-manager"` for package manager alternatives. |
| Alternative workflows | `::tabs` and `:::tabs-item` | Give each item a `label`. Keep required instructions outside the tabs. |
| Input and output of a pipeline step | `::flow-diagram` | Set `preset` to `adapter`, `macros`, or `parsers`. The component shows the code before and after the step side by side. |
| Generated directory structures | `::file-tree` | Supply the `tree` array as YAML component props, with `name`, `type`, and optional `children`. |
| Examples spanning multiple files | `::code-tree` | Label code fences with their file paths. |
| Optional long code examples | `::code-collapse` | Set a descriptive `name`. Keep setup and required examples visible. |
| Optional explanations | `::collapsible` | Set a descriptive `name`. Keep requirements and warnings visible. |
| Frequently asked questions | `::accordion` and `:::accordion-item` | Give each item a `label` and preserve linked heading anchors. |
| A rendered example and its source | `::code-preview` | Put the example in the default slot and its source under `#code`. |
| Copyable AI instructions | `::prompt` | Supply a `description` and put the copied text in the body. The body is not displayed, so keep any prompt readers need to inspect in a visible code block. |
| Short status labels | `:badge[Label]` | Use a label readers need to interpret the content. |
| Keyboard shortcuts | `:kbd[Enter]` | Use for keyboard keys rather than commands. |
| Icons beside labels | `:icon{name="i-iconoir-code"}` | Keep a readable text label beside the icon. |
| File type icons | `:code-icon{filename="kubb.config.ts"}` | Code block tabs already infer these icons from their file labels. |

GitHub alerts render as callouts on kubb.dev and also work in repository-only Markdown such as READMEs and ADRs. Keep those files in GitHub-compatible syntax. MDC components belong in site pages, their included snippets, and the Studio docs in the platform repository.

Close a component with the same number of colons used to open it. Use one more colon for a nested component, including code groups and file trees inside steps:

````md
::steps{level="2"}

## Install the package

:::code-group{sync="package-manager"}

```shell [pnpm]
pnpm add -D kubb
```

```shell [npm]
npm install --save-dev kubb
```

:::

::
````

The site also registers its existing diagrams, `::terminal`, and `::studio-cta`. Reuse them with their current props when the content calls for them.
