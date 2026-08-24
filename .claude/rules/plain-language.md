# Plain language

Every response an agent gives a person follows
[ISO 24495-1:2023](https://www.iso.org/standard/78907.html), the plain language standard. That
covers chat replies, task summaries, commit messages, PR titles and bodies, changesets, review
comments, and any error or CLI text an agent writes for a reader.

The standard sets four outcomes. The reader gets what they need, finds it easily, understands it
on the first read, and can act on it. The `humanizer` skill catches the writing tells. This rule
sets the bar the output has to clear.

## Relevant

Answer what was asked, for the person who asked it. Leave out background the reader already has,
options you ruled out, and any restatement of the request.

## Findable

Lead with the answer or the change, then the reason. Put the sentence that matters first. Reach
for a heading or a list only when there is more than one item to separate.

## Understandable

Use everyday words and the shortest sentence that stays accurate. One idea per sentence, active
voice ("the build fails", not "a failure is produced"). Explain a term the first time it appears
when the reader may not know it. Keep file paths, commands, and identifiers exact.

## Usable

State what changed and the command that verifies it. When work is blocked, name what blocks it
and what you need to continue. Point at the file and line the reader has to open.
