# 005, document the simplified contract

## Context

The creating-plugins guide still teaches JSX first and blurs the three ways code becomes text. After the refactor, the guide should lead with the builder path and name the emit roles, so a new plugin author learns the minimal path.

## Goal (demonstrable outcome)

The creating-plugins guide builds, its first runnable example uses the builder API, and a roles section distinguishes the printer, the renderer, and the serializer.

## Prerequisites

Slices 001 through 004.

## Steps

1. Update `apps/kubb.dev/docs/5.x/guides/creating-plugins.md` and the concepts pages for plugins and parsers in the platform repo to lead with builder output and present JSX as opt-in.
2. Add a short roles section: the printer turns a schema node into a string, the renderer turns JSX into a `FileNode` and is optional, and the serializer turns a `FileNode` into the final file.
3. Document the plugin-kit surface.
4. Run the `humanizer` skill over the edited markdown and fix the tells it surfaces.
5. Build the docs so the twoslash examples compile.

## Files touched

- `apps/kubb.dev/docs/5.x/guides/creating-plugins.md` (modified, platform repo)
- `apps/kubb.dev/docs/5.x/concepts/plugins.md` and `parsers.md` (modified, or their upstream source content)

## Verification

1. `pnpm --filter kubb.dev build` compiles the twoslash examples.
2. A read confirms the builder-first example and the roles section.

## Done criteria

- [ ] The docs build with the examples compiling
- [ ] The first example is builder-first and JSX is presented as opt-in
- [ ] The roles section names printer, renderer, and serializer
- [ ] The humanizer pass is done
