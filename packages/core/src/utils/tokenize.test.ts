import { describe, expect, test } from 'vitest'
import { tokenize } from './tokenize.ts'

describe('tokenize', () => {
  test.each([
    // basic splitting
    ['git commit -m message', ['git', 'commit', '-m', 'message']],
    ['echo hello', ['echo', 'hello']],
    // single word
    ['ls', ['ls']],
    // empty string
    ['', []],
    // extra whitespace
    ['  echo   hello  ', ['echo', 'hello']],
    // tabs
    ['echo\thello', ['echo', 'hello']],
    // double quotes preserve spaces
    ['echo "hello world"', ['echo', 'hello world']],
    // single quotes preserve spaces
    ["echo 'hello world'", ['echo', 'hello world']],
    // double quotes with flag
    ['git commit -m "fix: my bug"', ['git', 'commit', '-m', 'fix: my bug']],
    // single quotes with flag
    ["git commit -m 'fix: my bug'", ['git', 'commit', '-m', 'fix: my bug']],
    // quoted arg with multiple spaces inside
    ['cmd "a  b  c"', ['cmd', 'a  b  c']],
    // multiple quoted args
    ['"foo bar" "baz qux"', ['foo bar', 'baz qux']],
    // unquoted args with flags
    ['npx prettier --write src/', ['npx', 'prettier', '--write', 'src/']],
    // path with spaces in quotes
    ['node "/path/to my/script.js"', ['node', '/path/to my/script.js']],
  ])('tokenize(%s)', (input, expected) => {
    expect(tokenize(input)).toEqual(expected)
  })
})
