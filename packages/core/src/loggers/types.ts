import type { KubbEvents } from "../Kubb.ts";
import type { AsyncEventEmitter } from "../utils/AsyncEventEmitter";

/**
 * Shared context passed to all plugins, parsers, and Fabric internals.
 */
interface LoggerContext extends AsyncEventEmitter<KubbEvents> {}

type Install<TOptions = unknown> = (
  context: LoggerContext,
  options?: TOptions,
) => void | Promise<void>;

export type Logger<TOptions = unknown> = {
  name: string;
  install: Install<TOptions>;
};

export type UserLogger<TOptions = unknown> = Logger<TOptions>;
