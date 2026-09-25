import { readFileSync } from 'node:fs'
import process from 'node:process'

/**
 * Stable identity for the CI agent a snapshot run registers or reuses.
 */
export type CiContext = {
  /**
   * Fed into the machine token, so the same merge or pull request reuses one agent.
   */
  id: string
  /**
   * Agent display name shown in Studio.
   */
  name: string
  /** The commit this run builds, so the next snapshot can diff against it. */
  commit?: string
  /** The branch a pull request merges into, and the `id` runs on that branch register under. */
  base?: { branch: string; id: string }
}

type GithubPullRequest = { number: number; head?: { sha?: string }; base?: { ref?: string } }

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

/**
 * Reproduces GitLab's `CI_COMMIT_REF_SLUG`, which scopes a branch pipeline's agent, for a branch
 * name GitLab gives no slug of, such as a merge request's target branch.
 */
export function gitlabRefSlug(ref: string): string {
  return ref
    .toLowerCase()
    .replace(/[^a-z0-9]/gu, '-')
    .slice(0, 63)
    .replace(/^-+|-+$/g, '')
}

/**
 * Detects the CI provider from its environment variables and derives a stable identity from it.
 * The GitHub row reproduces `gh:<repositoryId>:<prNumber>`, the identity `kubb-labs/action` has
 * always registered agents under, so an existing repository keeps reusing its agent.
 */
export function detectCi(env: Record<string, string | undefined> = process.env): CiContext | null {
  if (env.GITHUB_ACTIONS) {
    const pullRequest = readGithubPullRequest(env.GITHUB_EVENT_PATH)
    const repositoryId = env.GITHUB_REPOSITORY_ID ?? env.GITHUB_REPOSITORY ?? ''
    const branch = env.GITHUB_REF?.startsWith('refs/heads/') ? env.GITHUB_REF.slice('refs/heads/'.length) : undefined
    // A branch run is scoped by its ref, which a pull request number never collides with.
    const scope = pullRequest?.number ?? (branch ? `refs/heads/${branch}` : env.GITHUB_RUN_ID) ?? ''
    const baseBranch = pullRequest?.base?.ref

    return {
      id: `gh:${repositoryId}:${scope}`,
      name: `${env.GITHUB_REPOSITORY ?? 'github'}#${pullRequest?.number ?? branch ?? scope}`,
      // The head commit, not the merge commit a pull request run checks out.
      commit: pullRequest?.head?.sha ?? env.GITHUB_SHA,
      base: baseBranch ? { branch: baseBranch, id: `gh:${repositoryId}:refs/heads/${baseBranch}` } : undefined,
    }
  }

  if (env.GITLAB_CI) {
    const scope = env.CI_MERGE_REQUEST_IID ?? env.CI_COMMIT_REF_SLUG ?? ''
    const baseBranch = env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME

    return {
      id: `gl:${env.CI_PROJECT_ID ?? ''}:${scope}`,
      name: `${env.CI_PROJECT_PATH ?? 'gitlab'}#${scope}`,
      commit: env.CI_MERGE_REQUEST_SOURCE_BRANCH_SHA || env.CI_COMMIT_SHA,
      base: baseBranch ? { branch: baseBranch, id: `gl:${env.CI_PROJECT_ID ?? ''}:${gitlabRefSlug(baseBranch)}` } : undefined,
    }
  }

  if (env.BITBUCKET_BUILD_NUMBER) {
    const scope = env.BITBUCKET_PR_ID ?? env.BITBUCKET_BRANCH ?? ''

    return { id: `bb:${env.BITBUCKET_REPO_UUID ?? ''}:${scope}`, name: `${env.BITBUCKET_REPO_FULL_NAME ?? 'bitbucket'}#${scope}`, commit: env.BITBUCKET_COMMIT }
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
