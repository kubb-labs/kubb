import process from 'node:process'

/**
 * Returns `true` when a known CI provider has set its environment variable.
 */
export function isCIEnvironment(): boolean {
  return !!(
    process.env.CI ||
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
