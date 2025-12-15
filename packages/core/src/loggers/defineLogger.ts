import type { Logger, UserLogger } from "./types.ts";

export function defineLogger<Options = unknown>(
  logger: UserLogger<Options>,
): Logger<Options> {
  return {
    ...logger,
  };
}
