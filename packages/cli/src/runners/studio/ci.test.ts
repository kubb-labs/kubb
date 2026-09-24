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

  it('reads the head commit and the base branch of a GitHub pull request, never the merge commit', () => {
    const eventPath = writeGithubEvent({ pull_request: { number: 42, head: { sha: 'head1234' }, base: { ref: 'main' } } })

    expect(
      detectCi({
        GITHUB_ACTIONS: 'true',
        GITHUB_REPOSITORY_ID: '123456',
        GITHUB_REPOSITORY: 'acme/api',
        GITHUB_EVENT_PATH: eventPath,
        GITHUB_SHA: 'merge5678',
      }),
    ).toEqual({ id: 'gh:123456:42', name: 'acme/api#42', commit: 'head1234', baseBranch: 'main', baseId: 'gh:123456:refs/heads/main' })
  })

  it('gives a GitHub branch run one agent per branch, the one pull requests into it compare with', () => {
    const eventPath = writeGithubEvent({ pull_request: { number: 42, base: { ref: 'main' } } })
    const pullRequest = detectCi({ GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY_ID: '123456', GITHUB_EVENT_PATH: eventPath })
    const branch = detectCi({
      GITHUB_ACTIONS: 'true',
      GITHUB_REPOSITORY_ID: '123456',
      GITHUB_REPOSITORY: 'acme/api',
      GITHUB_REF: 'refs/heads/main',
      GITHUB_RUN_ID: '987',
      GITHUB_SHA: 'a1b2c3d',
    })

    expect(branch).toEqual({ id: 'gh:123456:refs/heads/main', name: 'acme/api#main', commit: 'a1b2c3d' })
    expect(pullRequest?.baseId).toBe(branch?.id)
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

  it('compares a GitLab merge request with the agent a pipeline on its target branch registers under', () => {
    const mergeRequest = detectCi({
      GITLAB_CI: 'true',
      CI_PROJECT_ID: '77',
      CI_PROJECT_PATH: 'acme/api',
      CI_MERGE_REQUEST_IID: '9',
      CI_MERGE_REQUEST_TARGET_BRANCH_NAME: 'Release/2.x',
      CI_MERGE_REQUEST_SOURCE_BRANCH_SHA: 'head1234',
      CI_COMMIT_SHA: 'merge5678',
    })
    const branch = detectCi({ GITLAB_CI: 'true', CI_PROJECT_ID: '77', CI_COMMIT_REF_SLUG: 'release-2-x' })

    expect(mergeRequest).toEqual({ id: 'gl:77:9', name: 'acme/api#9', commit: 'head1234', baseBranch: 'Release/2.x', baseId: 'gl:77:release-2-x' })
    expect(mergeRequest?.baseId).toBe(branch?.id)
  })

  it('reproduces CI_COMMIT_REF_SLUG', () => {
    expect(gitlabRefSlug('Feature/Add_Pets')).toBe('feature-add-pets')
    expect(gitlabRefSlug('-main-')).toBe('main')
    expect(gitlabRefSlug('a'.repeat(70))).toHaveLength(63)
  })

  it('compares a Bitbucket pull request with its destination branch', () => {
    expect(
      detectCi({ BITBUCKET_BUILD_NUMBER: '5', BITBUCKET_REPO_UUID: '{repo-uuid}', BITBUCKET_PR_ID: '3', BITBUCKET_PR_DESTINATION_BRANCH: 'main' }),
    ).toMatchObject({ baseBranch: 'main', baseId: 'bb:{repo-uuid}:main' })
    expect(detectCi({ BITBUCKET_BUILD_NUMBER: '5', BITBUCKET_REPO_UUID: '{repo-uuid}', BITBUCKET_BRANCH: 'main' })?.id).toBe('bb:{repo-uuid}:main')
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
