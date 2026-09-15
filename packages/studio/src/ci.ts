import { detectProvider, env, isCI } from 'std-env'

export type CIProvider = 'github' | 'gitlab' | 'bitbucket' | 'circleci' | 'azure' | 'jenkins' | 'buildkite' | 'generic'

export interface CIContext {
  provider: CIProvider
  repository?: string
  ref?: string
  branch?: string
  sha?: string
  actor?: string
  pipelineId?: string
  jobId?: string
  runUrl?: string
  pullRequest?: { id?: string; sourceBranch?: string; targetBranch?: string }
}

const providers: Record<string, CIProvider> = {
  github_actions: 'github',
  gitlab: 'gitlab',
  bitbucket: 'bitbucket',
  circle: 'circleci',
  azure_pipelines: 'azure',
  jenkins: 'jenkins',
  buildkite: 'buildkite',
}

export function detectCIContext(environment: Record<string, string | undefined> = env): CIContext | undefined {
  const detected = providers[detectProvider().name] ?? (isCI ? 'generic' : undefined)
  if (!detected) return undefined

  if (detected === 'github') {
    const repository = environment.GITHUB_REPOSITORY
    const runId = environment.GITHUB_RUN_ID
    const pullRequestId = environment.GITHUB_EVENT_NUMBER ?? /^refs\/pull\/(\d+)\//.exec(environment.GITHUB_REF ?? '')?.[1]

    return {
      provider: detected,
      repository,
      ref: environment.GITHUB_REF,
      branch: environment.GITHUB_REF_NAME,
      sha: environment.GITHUB_SHA,
      actor: environment.GITHUB_ACTOR,
      pipelineId: runId,
      jobId: environment.GITHUB_JOB,
      runUrl: repository && runId ? `${environment.GITHUB_SERVER_URL ?? 'https://github.com'}/${repository}/actions/runs/${runId}` : undefined,
      pullRequest: pullRequestId
        ? {
            id: pullRequestId,
            sourceBranch: environment.GITHUB_HEAD_REF,
            targetBranch: environment.GITHUB_BASE_REF,
          }
        : undefined,
    }
  }

  if (detected === 'gitlab') {
    return {
      provider: detected,
      repository: environment.CI_PROJECT_PATH,
      ref: environment.CI_COMMIT_REF_NAME,
      branch: environment.CI_COMMIT_BRANCH ?? environment.CI_COMMIT_REF_NAME,
      sha: environment.CI_COMMIT_SHA,
      actor: environment.GITLAB_USER_LOGIN,
      pipelineId: environment.CI_PIPELINE_ID,
      jobId: environment.CI_JOB_ID,
      runUrl: environment.CI_JOB_URL,
      pullRequest: environment.CI_MERGE_REQUEST_IID
        ? {
            id: environment.CI_MERGE_REQUEST_IID,
            sourceBranch: environment.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME,
            targetBranch: environment.CI_MERGE_REQUEST_TARGET_BRANCH_NAME,
          }
        : undefined,
    }
  }

  return { provider: detected }
}
