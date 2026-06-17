declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'

      /**
       * Standard opt-out flag used by many developer tools to disable telemetry.
       * Set to "1" or "true" to disable Kubb CLI telemetry.
       * @see https://consoledonottrack.com
       * @example "1"
       */
      DO_NOT_TRACK: string | undefined

      /**
       * Kubb-specific flag to disable telemetry.
       * Set to "1" or "true" to disable Kubb CLI telemetry.
       * @example "1"
       */
      KUBB_DISABLE_TELEMETRY: string | undefined

      /** Enables CI-specific behavior in tests and Playwright. */
      CI: string | undefined

      // CI environment detection variables
      /** Set by GitHub Actions */
      GITHUB_ACTIONS: string | undefined
      /** Set by GitLab CI */
      GITLAB_CI: string | undefined
      /** Set by Bitbucket Pipelines */
      BITBUCKET_BUILD_NUMBER: string | undefined
      /** Set by Jenkins */
      JENKINS_URL: string | undefined
      /** Set by CircleCI */
      CIRCLECI: string | undefined
      /** Set by Travis CI */
      TRAVIS: string | undefined
      /** Set by TeamCity */
      TEAMCITY_VERSION: string | undefined
      /** Set by Buildkite */
      BUILDKITE: string | undefined
      /** Set by Azure Pipelines */
      TF_BUILD: string | undefined
    }
  }
}

export {}
