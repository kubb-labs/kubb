---
"@kubb/plugin-swr": patch
---

Fix SWR mutation type issue by using SWRMutationConfiguration directly

Changed from using `Parameters<typeof useSWRMutation>[2]` to directly using `SWRMutationConfiguration` for mutation options. This resolves type inference issues caused by SWR's function overloading based on `throwOnError`, allowing flexible definition and passing of mutation configuration options.
