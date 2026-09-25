import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { detectCi, gitlabRefSlug } from './ci.ts'

const tempFiles: Array<string> = []

function writeGithubEvent(payload: unknown): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'kubb-studio-ci-'))
  const file = path.join(dir, 'event.json')
  writeFileSync(file, JSON.stringify(payload))
  tempFiles.push(dir)
  return file
}

afterEach(() => {
  for (const dir of tempFiles.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('detectCi', () => {
  it('returns null outside a known CI', () => {
    expect(detectCi({})).toBeNull()
  })

  it('derives the same id kubb-labs/action has always registered agents under', () => {
    const eventPath = writeGithubEvent({ pull_request: { number: 42 } })

    expect(
      detectCi({
        GITHUB_ACTIONS: 'true',
        GITHUB_REPOSITORY_ID: '123456',
        GITHUB_REPOSITORY: 'acme/api',
        GITHUB_EVENT_PATH: eventPath,
      }),
    ).toEqual({ id: 'gh:123456:42', name: 'acme/api#42' })
  })

  it('reads the head commit and the base branch of a GitHub pull request, and the base matches a run on that branch', () => {
    const eventPath = writeGithubEvent({ pull_request: { number: 42, head: { sha: 'head1234' }, base: { ref: 'main' } } })
    const env = { GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY_ID: '123456', GITHUB_REPOSITORY: 'acme/api', GITHUB_SHA: 'merge5678' }

    const pullRequest = detectCi({ ...env, GITHUB_EVENT_PATH: eventPath })
    const branch = detectCi({ ...env, GITHUB_REF: 'refs/heads/main' })

    expect(pullRequest).toEqual({
      id: 'gh:123456:42',
      name: 'acme/api#42',
      commit: 'head1234',
      base: { branch: 'main', id: 'gh:123456:refs/heads/main' },
    })
    expect(branch).toEqual({ id: 'gh:123456:refs/heads/main', name: 'acme/api#main', commit: 'merge5678' })
  })

  it('falls back to the run id when GitHub Actions has no pull request', () => {
    expect(
      detectCi({
        GITHUB_ACTIONS: 'true',
        GITHUB_REPOSITORY_ID: '123456',
        GITHUB_REPOSITORY: 'acme/api',
        GITHUB_RUN_ID: '987',
      }),
    ).toEqual({ id: 'gh:123456:987', name: 'acme/api#987' })
  })

  it('derives an id from GitLab CI', () => {
    expect(
      detectCi({
        GITLAB_CI: 'true',
        CI_PROJECT_ID: '77',
        CI_PROJECT_PATH: 'acme/api',
        CI_MERGE_REQUEST_IID: '9',
      }),
    ).toEqual({ id: 'gl:77:9', name: 'acme/api#9' })
  })

  it('falls back to the branch slug when GitLab CI has no merge request', () => {
    expect(
      detectCi({
        GITLAB_CI: 'true',
        CI_PROJECT_ID: '77',
        CI_PROJECT_PATH: 'acme/api',
        CI_COMMIT_REF_SLUG: 'main',
      }),
    ).toEqual({ id: 'gl:77:main', name: 'acme/api#main' })
  })

  it('reads the target branch of a GitLab merge request, and the base matches a pipeline on that branch', () => {
    const env = { GITLAB_CI: 'true', CI_PROJECT_ID: '77', CI_PROJECT_PATH: 'acme/api' }

    const mergeRequest = detectCi({ ...env, CI_MERGE_REQUEST_IID: '9', CI_MERGE_REQUEST_TARGET_BRANCH_NAME: 'release/2.x' })
    const branch = detectCi({ ...env, CI_COMMIT_REF_SLUG: 'release-2-x' })

    expect(mergeRequest?.base).toEqual({ branch: 'release/2.x', id: 'gl:77:release-2-x' })
    expect(mergeRequest?.base?.id).toBe(branch?.id)
  })

  it('derives an id from Bitbucket Pipelines', () => {
    expect(
      detectCi({
        BITBUCKET_BUILD_NUMBER: '5',
        BITBUCKET_REPO_UUID: '{repo-uuid}',
        BITBUCKET_REPO_FULL_NAME: 'acme/api',
        BITBUCKET_PR_ID: '3',
      }),
    ).toEqual({ id: 'bb:{repo-uuid}:3', name: 'acme/api#3' })
  })

  it('derives an id from CircleCI', () => {
    expect(
      detectCi({
        CIRCLECI: 'true',
        CIRCLE_PROJECT_USERNAME: 'acme',
        CIRCLE_PROJECT_REPONAME: 'api',
        CIRCLE_PR_NUMBER: '11',
      }),
    ).toEqual({ id: 'circle:acme:api:11', name: 'acme/api#11' })
  })

  it('qualifies the CircleCI id by owner, so two orgs with a same-named project never collide on one agent', () => {
    const forOwner = (owner: string) => detectCi({ CIRCLECI: 'true', CIRCLE_PROJECT_USERNAME: owner, CIRCLE_PROJECT_REPONAME: 'api', CIRCLE_PR_NUMBER: '11' })

    expect(forOwner('acme')?.id).not.toBe(forOwner('other')?.id)
  })

  it.each([
    [{ GITHUB_ACTIONS: 'true', GITHUB_SHA: 'a1b2c3d' }],
    [{ GITLAB_CI: 'true', CI_COMMIT_SHA: 'a1b2c3d' }],
    [{ BITBUCKET_BUILD_NUMBER: '7', BITBUCKET_COMMIT: 'a1b2c3d' }],
    [{ CIRCLECI: 'true', CIRCLE_SHA1: 'a1b2c3d' }],
  ])('reads the commit the run builds from %o', (env) => {
    expect(detectCi(env)?.commit).toBe('a1b2c3d')
  })
})

describe('gitlabRefSlug', () => {
  it.each([
    ['main', 'main'],
    ['Feature/Login_Page', 'feature-login-page'],
    ['-release/2.x-', 'release-2-x'],
    ['fix/🚀-launch', 'fix---launch'],
    ['a'.repeat(70), 'a'.repeat(63)],
  ])('slugs %s like GitLab', (ref, slug) => {
    expect(gitlabRefSlug(ref)).toBe(slug)
  })
})
