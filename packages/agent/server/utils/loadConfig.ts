import type { Config, PossibleConfig } from "@kubb/core";
import { getCosmiConfig } from "./getCosmiConfig.ts";

export async function getConfigs(
  config: PossibleConfig,
): Promise<Array<Config>> {
  const resolved = await (typeof config === "function" ? config() : config);
  const userConfigs = Array.isArray(resolved) ? resolved : [resolved];

  return userConfigs.map(
    (item) => ({ ...item, plugins: item.plugins ?? [] }) as Config,
  );
}

/**
 * Load and return the first Kubb config from the given config file path.
 */
export async function loadConfig(resolvedConfigPath: string) {
  const result = await getCosmiConfig(resolvedConfigPath);
  const configs = await getConfigs(result.config);

  if (configs.length === 0) {
    throw new Error("No configs found");
  }

  return configs[0];
}
