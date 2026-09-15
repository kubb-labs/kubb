import { afterEach, describe, expect, it, vi } from 'vitest'

const detectProvider = vi.fn(() => ({ name: 'github_actions' }))
vi.mock('std-env', () => ({ detectProvider, env: {}, isCI: true }))

const { detectCIContext } = await import('./ci.ts')

afterEach(() => {
  detectProvider.mockReset()
})

describe('detectCIContext', () => {
  it('maps GitHub Actions metadata without forwarding the environment', () => {
    detectProvider.mockReturnValue({ name: 'github_actions' })

    expect(
      detectCIContext({
        GITHUB_REPOSITORY: 'kubb-labs/kubb',
        GITHUB_REF: 'refs/pull/7/merge',
        GITHUB_REF_NAME: '7/merge',
        GITHUB_SHA: 'abc123',
        GITHUB_ACTOR: 'stijnvanhulle',
        GITHUB_RUN_ID: '42',
        GITHUB_JOB: 'generate',
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_HEAD_REF: 'feature/ci',
        GITHUB_BASE_REF: 'main',
        SECRET: 'must-not-appear',
      }),
    ).toEqual({
      provider: 'github',
      repository: 'kubb-labs/kubb',
      ref: 'refs/pull/7/merge',
      branch: '7/merge',
      sha: 'abc123',
      actor: 'stijnvanhulle',
      pipelineId: '42',
      jobId: 'generate',
      runUrl: 'https://github.com/kubb-labs/kubb/actions/runs/42',
      pullRequest: { id: '7', sourceBranch: 'feature/ci', targetBranch: 'main' },
    })
  })

  it('maps GitLab merge request metadata', () => {
    detectProvider.mockReturnValue({ name: 'gitlab' })

    expect(
      detectCIContext({
        CI_PROJECT_PATH: 'kubb-labs/kubb',
        CI_COMMIT_SHA: 'def456',
        CI_COMMIT_REF_NAME: 'feature/ci',
        CI_PIPELINE_ID: '8',
        CI_JOB_ID: '9',
        CI_JOB_URL: 'https://gitlab.example/jobs/9',
        GITLAB_USER_LOGIN: 'stijnvanhulle',
        CI_MERGE_REQUEST_IID: '10',
        CI_MERGE_REQUEST_SOURCE_BRANCH_NAME: 'feature/ci',
        CI_MERGE_REQUEST_TARGET_BRANCH_NAME: 'main',
      }),
    ).toEqual({
      provider: 'gitlab',
      repository: 'kubb-labs/kubb',
      ref: 'feature/ci',
      branch: 'feature/ci',
      sha: 'def456',
      actor: 'stijnvanhulle',
      pipelineId: '8',
      jobId: '9',
      runUrl: 'https://gitlab.example/jobs/9',
      pullRequest: { id: '10', sourceBranch: 'feature/ci', targetBranch: 'main' },
    })
  })

  it('falls back to generic CI when std-env cannot identify a provider', () => {
    detectProvider.mockReturnValue({ name: 'unknown-runner' })

    expect(detectCIContext({ CI: 'true', SECRET: 'must-not-appear' })).toEqual({ provider: 'generic' })
  })
})
