import { createHash } from "node:crypto";
import { tokenize } from "@internals/utils";
import type { AsyncEventEmitter, Config, KubbHooks } from "@kubb/core";

type ExecutingHooksProps = {
  configHooks: NonNullable<Config["hooks"]>;
  hooks: AsyncEventEmitter<KubbHooks>;
};

/**
 * Execute the `hooks.done` commands defined in the Kubb config sequentially.
 * Each command is emitted as a `hook:start` event; the plugin layer is responsible
 * for actually spawning the process and emitting `hook:end`.
 *
 */
export async function executeHooks({
  configHooks,
  hooks,
}: ExecutingHooksProps): Promise<void> {
  const commands = Array.isArray(configHooks.done)
    ? configHooks.done
    : [configHooks.done].filter(Boolean);

  for (const command of commands) {
    const [cmd, ...args] = tokenize(command);

    if (!cmd) {
      continue;
    }

    const hookId = createHash("sha256").update(command).digest("hex");
    await hooks.emit("kubb:hook:start", { id: hookId, command: cmd, args });

    await hooks.onOnce("kubb:hook:end", async ({ success, error }) => {
      if (!success) {
        throw error;
      }

      await hooks.emit("kubb:success", `${command} successfully executed`);
    });
  }
}
