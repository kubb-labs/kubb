---
"kubb": patch
---

Publish a prerelease (`rc`) build to work around npm version squatting on `unplugin-kubb`.

Versions 5.0.1 through 5.0.30 of `unplugin-kubb` were already published on npm from an
unrelated lineage and still depend on kubb v4, so any new 5.0.x patch collides with a version
that already exists and can't be reused. A prerelease version sidesteps this: it's a distinct
identifier from the squatted versions and publishes under the `rc` npm tag instead of `latest`,
so existing installs are unaffected while `kubb@rc` gets a working v5 setup.
