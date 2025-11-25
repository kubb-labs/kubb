# Agents and Docs (Repository Docs Guidelines)

This page explains the repository's approach to automated agents and provides guidance and conventions for the docs folder so contributors (including agent-assisted ones) can add or edit documentation consistently.

Purpose

- Explain what agents do in this repo and how to review their contributions.
- Document the layout and conventions used for the docs site so documentation is consistent and publishable.

Which agents are commonly used

- Dependabot for dependency updates.
- CI bots (GitHub Actions) for validation and automation.
- AI-assisted tools (Copilot, ChatGPT, or other assistants) used by contributors to draft content.

Docs layout and conventions

Repository docs are located in the docs/ folder and use Markdown (MD or MDX). Follow these conventions:

- Folder structure
  - docs/
    - getting-started.md
    - guides/
    - reference/
    - recipes/
    - images/

- File naming
  - Use kebab-case for file names: `how-to-do-thing.md`.
  - Use clear, short titles in frontmatter.

- Frontmatter
  - Each doc should include YAML frontmatter with at least `title:` and `sidebar_label:` (if used by the site).
  - Example:

  ```yaml
  ---
  title: "How to do the thing"
  sidebar_label: "How to do the thing"
  ---
  ```

- Images and assets
  - Place images used by docs under docs/images or docs/static and reference them with relative paths.
  - Keep image sizes reasonable and use optimized formats (webp/png/jpg) as appropriate.

- Structure and tone
  - Use short paragraphs, examples, and code blocks where helpful.
  - Prefer actionable steps and include expected outputs for commands.

Example docs tree

```
docs/
├─ getting-started.md
├─ guides/
│  ├─ configuration.md
│  └─ migration.md
├─ reference/
│  └─ api.md
├─ recipes/
│  └─ troubleshooting.md
└─ images/
   └─ architecture.png
```

How to propose docs changes

- Create a branch and open a PR with a clear title and description.
- Include a short summary of the change in the PR body and link to any relevant issues.
- Ensure CI and linters pass, and preview the docs if the site preview is available.

Review guidance for agent-created docs

- Verify factual accuracy and check for hallucinations.
- Confirm frontmatter and file placement are correct for site navigation.
- Ensure links and images resolve correctly on the built site.

Templates and examples

- Use existing docs pages as a template when adding new content.
- For major docs rewrites, open an issue first to discuss structure and scope.

Questions or changes to these guidelines

Open an issue or discuss with the maintainers if you'd like to change how agents are used or how docs are organized.
