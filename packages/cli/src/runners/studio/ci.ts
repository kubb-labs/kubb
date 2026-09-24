import { readFileSync } from 'node:fs'
import process from 'node:process'

/**
 * Stable identity for the CI agent a snapshot run registers or reuses.
 */
export type CiContext = {
  /**
   * Fed into the machine token, so the same merge or pull request, or the same branch, reuses one agent.
   */
  id: string
  /**
   * Agent display name shown in Studio.
   */
  name: string
  /** The commit this run builds (a pull request's head), so the next snapshot can diff against it. */
  commit?: string
  /** The branch a pull request merges into. */
  baseBranch?: string
  /** The `id` a run on `baseBranch` registers under, whose latest snapshot a pull request compares with. */
  baseId?: string
}

type GithubPullRequest = { number?: number; head?: { sha?: string }; base?: { ref?: string } }

function readGithubPullRequest(eventPath: string | undefined): GithubPullRequest | undefined {
  if (!eventPath) {
    return undefined
  }

  try {
    const event = JSON.parse(readFileSync(eventPath, 'utf8')) as { pull_request?: GithubPullRequest }

    return event.pull_request?.number ? event.pull_request : undefined
  } catch {
    return undefined
  }
}

/** Reproduces GitLab's `CI_COMMIT_REF_SLUG`, the scope of a branch pipeline's agent. */
export function gitlabRefSlug(ref: string): string {
  return ref
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 63)
    .replace(/^-+|-+$/g, '')
}

function withBase(context: CiContext, baseBranch: string | undefined, baseId: string): CiContext {
  return baseBranch ? { ...context, baseBranch, baseId } : context
}

/**
 * Detects the CI provider from its environment variables and derives a stable identity from it.
 * GitHub pull requests keep `gh:<repositoryId>:<prNumber>`, the identity `kubb-labs/action` has
 * always used, and a branch run uses `gh:<repositoryId>:refs/heads/<branch>`.
 */
export function detectCi(env: Record<string, string | undefined> = process.env): CiContext | null {
  if (env.GITHUB_ACTIONS) {
    const pullRequest = readGithubPullRequest(env.GITHUB_EVENT_PATH)
    const repositoryId = env.GITHUB_REPOSITORY_ID ?? env.GITHUB_REPOSITORY ?? ''
    const repository = env.GITHUB_REPOSITORY ?? 'github'

    if (pullRequest?.number) {
      const baseBranch = pullRequest.base?.ref ?? env.GITHUB_BASE_REF

      return withBase(
        { id: `gh:${repositoryId}:${pullRequest.number}`, name: `${repository}#${pullRequest.number}`, commit: pullRequest.head?.sha ?? env.GITHUB_SHA },
        baseBranch,
        `gh:${repositoryId}:refs/heads/${baseBranch}`,
      )
    }

    if (env.GITHUB_REF?.startsWith('refs/heads/')) {
      const branch = env.GITHUB_REF.slice('refs/heads/'.length)

      return { id: `gh:${repositoryId}:${env.GITHUB_REF}`, name: `${repository}#${branch}`, commit: env.GITHUB_SHA }
    }

    const scope = env.GITHUB_RUN_ID ?? ''

    return { id: `gh:${repositoryId}:${scope}`, name: `${repository}#${scope}`, commit: env.GITHUB_SHA }
  }

  if (env.GITLAB_CI) {
    const scope = env.CI_MERGE_REQUEST_IID ?? env.CI_COMMIT_REF_SLUG ?? ''
    const context = {
      id: `gl:${env.CI_PROJECT_ID ?? ''}:${scope}`,
      name: `${env.CI_PROJECT_PATH ?? 'gitlab'}#${scope}`,
      // A merged results pipeline builds a merge commit; the source branch sha is the head.
      commit: env.CI_MERGE_REQUEST_SOURCE_BRANCH_SHA || env.CI_COMMIT_SHA,
    }
    const baseBranch = env.CI_MERGE_REQUEST_IID ? env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME : undefined

    return withBase(context, baseBranch, `gl:${env.CI_PROJECT_ID ?? ''}:${gitlabRefSlug(baseBranch ?? '')}`)
  }

  if (env.BITBUCKET_BUILD_NUMBER) {
    const scope = env.BITBUCKET_PR_ID ?? env.BITBUCKET_BRANCH ?? ''
    const context = {
      id: `bb:${env.BITBUCKET_REPO_UUID ?? ''}:${scope}`,
      name: `${env.BITBUCKET_REPO_FULL_NAME ?? 'bitbucket'}#${scope}`,
      commit: env.BITBUCKET_COMMIT,
    }
    const baseBranch = env.BITBUCKET_PR_ID ? env.BITBUCKET_PR_DESTINATION_BRANCH : undefined

    return withBase(context, baseBranch, `bb:${env.BITBUCKET_REPO_UUID ?? ''}:${baseBranch}`)
  }

  if (env.CIRCLECI) {
    // Owner-qualified: two projects with the same name under different CircleCI orgs must not
    // collide on one agent, since registering it purges the other project's live sessions.
    const owner = env.CIRCLE_PROJECT_USERNAME ?? ''
    const project = env.CIRCLE_PROJECT_REPONAME ?? 'circleci'
    const scope = env.CIRCLE_PR_NUMBER ?? env.CIRCLE_BRANCH ?? ''

    return { id: `circle:${owner}:${project}:${scope}`, name: `${owner ? `${owner}/` : ''}${project}#${scope}`, commit: env.CIRCLE_SHA1 }
  }

  return null
}
