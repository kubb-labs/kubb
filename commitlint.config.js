// same names like release-please is using
const types = {
  feat: 'Features',
  fix: 'Bug Fixes',
  perf: 'Performance Improvements',
  deps: 'Dependencies',
  revert: 'Reverts',
  docs: 'Documentation',
  style: 'Styles',
  chore: 'Miscellaneous Chores',
  refactor: 'Code Refactoring',
  test: 'Tests',
  build: 'Build System',
  ci: 'Continuous Integration',
}

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', Object.keys(types)],
  },
}
