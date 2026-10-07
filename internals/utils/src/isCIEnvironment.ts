import process from 'node:process'

/**
 * Returns `true` when a known CI provider has set its environment variable.
 * `CI=false` and `CI=0` count as not CI, so a user can opt out locally.
 */
export function isCIEnvironment(): boolean {
  const ci = process.env.CI
  return !!(
    (ci && ci !== 'false' && ci !== '0') ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.BITBUCKET_BUILD_NUMBER ||
    process.env.JENKINS_URL ||
    process.env.CIRCLECI ||
    process.env.TRAVIS ||
    process.env.TEAMCITY_VERSION ||
    process.env.BUILDKITE ||
    process.env.TF_BUILD
  )
}
