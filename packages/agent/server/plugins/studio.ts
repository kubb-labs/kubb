import process from "node:process";
import { maskString } from "@internals/utils";
import type { AgentConnectResponse } from "~/types/agent.ts";
import { createAgentSession, registerAgent } from "~/utils/api.ts";
import { connectToStudio } from "~/utils/connectStudio.ts";
import { logger } from "~/utils/logger.ts";
import { resolveStudioRuntimeConfig } from "~/utils/runtimeConfig.ts";

/**
 * Normalizes unknown thrown values into a logger-friendly message string.
 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Nitro plugin that connects the agent to Kubb Studio on server startup.
 *
 * When `KUBB_AGENT_TOKEN` and `KUBB_STUDIO_URL` are set, it:
 * 1. Loads the Kubb config referenced by `KUBB_AGENT_CONFIG`.
 * 2. Obtains a WebSocket session from Studio (using the session cache when available).
 * 3. Opens a persistent WebSocket and registers handlers for `generate` and `connect` commands.
 * 4. Forwards Kubb generation lifecycle events to Studio in real time.
 * 5. Sends a ping every 30 seconds to keep the connection alive.
 * 6. Gracefully disconnects when the Nitro server closes.
 *
 * The agent creates a pool of sessions (`KUBB_AGENT_POOL_SIZE`, default 1)
 * so each Studio user gets their own isolated WebSocket session.
 */
export default defineNitroPlugin(async (nitro) => {
  const {
    studioUrl,
    token,
    configPath,
    resolvedConfigPath,
    retryInterval,
    heartbeatInterval,
    root,
    allowAll,
    allowWrite,
    allowPublish,
    poolSize,
    hasSecret,
  } = resolveStudioRuntimeConfig(process.env);

  if (!token) {
    logger.warn("KUBB_AGENT_TOKEN not set", "cannot authenticate with studio");

    return null;
  }

  if (!hasSecret) {
    logger.warn("KUBB_AGENT_SECRET not set", "secret should be set");
  }

  const maskedToken = maskString(token);

  try {
    await registerAgent({ token, studioUrl, poolSize });

    const baseOptions = {
      token,
      studioUrl,
      configPath,
      resolvedConfigPath,
      allowAll,
      allowWrite,
      allowPublish,
      root,
      retryInterval,
      heartbeatInterval,
      nitro,
    };

    logger.info(
      `[${maskedToken}] Starting session pool of ${poolSize} connection(s)`,
    );

    const sessions = new Map<number, AgentConnectResponse | null>();
    for (const index of Array.from({ length: poolSize }, (_, i) => i)) {
      const session = await createAgentSession({ token, studioUrl }).catch(
        (error: unknown) => {
          logger.warn(
            `[${maskedToken}] Failed to pre-create pool session ${index}:`,
            getErrorMessage(error),
          );
          return null;
        },
      );
      sessions.set(index, session);
    }

    for (const [index, session] of sessions.entries()) {
      if (!session) {
        continue;
      }
      const maskedSessionId = maskString(session.sessionId);

      logger.info(
        `[${maskedSessionId}] Connecting session ${index + 1}/${sessions.size}`,
      );
      await connectToStudio({ ...baseOptions, initialSession: session }).catch(
        (error: unknown) => {
          logger.warn(
            `[${maskedSessionId}] Session ${index + 1} failed to connect:`,
            getErrorMessage(error),
          );
        },
      );
    }
  } catch (error: unknown) {
    logger.error("Failed to connect to Kubb Studio\n", getErrorMessage(error));
  }
});
