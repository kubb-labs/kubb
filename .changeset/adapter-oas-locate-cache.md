---
'@kubb/adapter-oas': patch
---

Speed up `locate` when a caller passes the same spec content as a new string. Diagnostics and editor tools that map many JSON pointers for one spec now compare the spec text once instead of on every call. On a 1.9 MB spec, 6,676 lookups drop from 4.6 s to 0.5 s.
