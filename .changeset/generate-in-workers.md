---
'@kubb/core': minor
'@kubb/cli': minor
'@kubb/adapter-oas': minor
---

Add `KUBB_WORKERS=<n>` to run the generators of a large spec in `n` worker threads, each on a range of the schemas and operations. The main thread parses the spec, replays the names every range resolved so the output matches a single-threaded run, runs the `operations` generators and writes the files. Experimental and off by default.
