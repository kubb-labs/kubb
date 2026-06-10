---
"@kubb/core": minor
---

Default the `tag` group folder name to the plain camelCased tag instead of `${tag}Controller`.

With `group: { type: 'tag' }`, files now land in `pet/` rather than `petController/`. The `Controller` suffix was a leftover convention nothing else in the output referenced. To keep the old layout, set `group: { type: 'tag', name: ({ group }) => \`${group}Controller\` }`.
