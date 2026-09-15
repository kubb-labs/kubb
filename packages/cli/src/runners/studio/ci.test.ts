import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { detectCi } from './ci.ts'

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
})
