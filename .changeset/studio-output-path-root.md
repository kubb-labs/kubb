---
'@kubb/studio': patch
---

Refuse a Studio generation job that would write outside the project root. Studio could set a plugin's `output.path`, also inside `override`, or add a plugin of its own, so any member of the Studio organization could make an agent with write access overwrite any file it can reach, such as `~/.ssh/authorized_keys`. The agent now stops the job before it generates and reports a `KUBB_PATH_TRAVERSAL` error. An output path that `kubb.config.ts` sets itself still works, also outside the root.
