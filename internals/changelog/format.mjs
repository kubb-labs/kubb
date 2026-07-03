// The heading grammar shared by the changelog writer (index.mjs) and anything
// that reads CHANGELOG.md back out (scripts/createReleases.mjs). Kept in one
// place so the two can't drift into two independently-escaped, independently
// anchored regexes for the same headings.

function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// The lookahead after the version rejects a longer, hyphen-suffixed version
// sharing the same numeric prefix (e.g. searching for "5.0.0" must not match
// a "## v5.0.0-rc.1" heading), while still matching the exact version
// followed by whitespace, a separator, or end of line.
export function versionHeadingPattern(version) {
  return new RegExp(`^##\\s+v?${escapeForRegExp(version)}(?![\\w.-]).*$`, 'm')
}

export function packageHeadingPattern(name) {
  return new RegExp(`^###\\s+${escapeForRegExp(name)}\\s*$`, 'm')
}
