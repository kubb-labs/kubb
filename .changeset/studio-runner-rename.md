---
'@kubb/studio': minor
'@kubb/cli': minor
---

Rename "agent" to "runner" and "project" in the Studio runtime. A runner is the process that connects to Kubb Studio, such as `kubb studio` or the Docker image. A project is the record you manage in Studio.

This is a breaking change with no aliases. This `@kubb/studio` version only works with a Kubb Studio that serves `/api/runner/*`. An older Studio rejects it, and an older `@kubb/studio` does not connect to a new Studio. Upgrade both together.

### Changed

- The runner endpoints are `/api/runner/token` and `/api/runner/socket`. They were under `/api/agent/`.
- `KUBB_AGENT_MAX_GENERATIONS` is now `KUBB_RUNNER_MAX_GENERATIONS`, and `KUBB_AGENT_MAX_GENERATIONS_MB` is now `KUBB_RUNNER_MAX_GENERATIONS_MB`. Kubb ignores the old names.
- `kubb studio snapshot --json` prints `projectUrl` instead of `agentUrl`, and the URL points to `/projects/<slug>`.
- `~/.kubb` credentials store `projectId` and `projectSlug` instead of `agentId` and `agentSlug`. Kubb treats older credentials as not paired, so run `kubb studio login` once after you upgrade.

### Removed

These `@kubb/studio` and `@kubb/studio/protocol` exports have new names:

| Before                   | After                     |
| ------------------------ | ------------------------- |
| `connectAgent`           | `connectRunner`           |
| `ConnectAgentOptions`    | `ConnectRunnerOptions`    |
| `pairAgent`              | `pairRunner`              |
| `InvalidAgentTokenError` | `InvalidRunnerTokenError` |
| `IncompatibleAgentError` | `IncompatibleRunnerError` |
| `AgentApi`               | `RunnerApi`               |
| `AgentConnectInfo`       | `RunnerConnectInfo`       |
| `AgentMessage`           | `RunnerMessage`           |
| `AgentCloseCode`         | `RunnerCloseCode`         |
| `AgentPermission`        | `RunnerPermission`        |
| `AgentPermissions`       | `RunnerPermissions`       |
| `AGENT_SOCKET_PATH`      | `RUNNER_SOCKET_PATH`      |
| `AGENT_INSTANCE_HEADER`  | `RUNNER_INSTANCE_HEADER`  |

These protocol fields and values have new names:

| Before                                                         | After             |
| -------------------------------------------------------------- | ----------------- |
| `agentSlug` in `RunnerConnectInfo` and `studio:connected`      | `projectSlug`     |
| `versions.agent` in the connect payload and `studio:connected` | `versions.runner` |
| `agent` in the pairing result and the snapshot result          | `project`         |
| `agent_kind` in the pairing request                            | `runner_kind`     |
| `kubb-agent` as the pairing `client_id`                        | `kubb-runner`     |

The `RunnerMessage` texts and the error messages say "runner" where they said "agent".
