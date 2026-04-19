import { describe, expect, it, vi } from "vitest";
import { loadConfig } from "./loadConfig.ts";

vi.mock("./getCosmiConfig.ts", () => ({
  getCosmiConfig: vi.fn(),
}));

import { getCosmiConfig } from "./getCosmiConfig.ts";

describe("loadConfig", () => {
  it("returns the first config when multiple configs are found", async () => {
    const first = {
      name: "first",
      input: { path: "spec.yaml" },
      output: { path: "./gen" },
      plugins: [],
    };
    const second = {
      name: "second",
      input: { path: "spec.yaml" },
      output: { path: "./gen" },
      plugins: [],
    };

    vi.mocked(getCosmiConfig).mockResolvedValue({
      config: [first, second],
    } as any);

    await expect(loadConfig("/project/kubb.config.ts")).resolves.toMatchObject({
      ...first,
      plugins: [],
    });
  });

  it("throws when no configs are found", async () => {
    vi.mocked(getCosmiConfig).mockResolvedValue({ config: [] } as any);

    await expect(loadConfig("/project/kubb.config.ts")).rejects.toThrow(
      "No configs found",
    );
  });

  it("passes the resolved config path to getCosmiConfig", async () => {
    const configPath = "/absolute/project/kubb.config.ts";

    vi.mocked(getCosmiConfig).mockResolvedValue({
      config: [{ name: "test", input: { path: "" }, output: { path: "" } }],
    } as any);

    await loadConfig(configPath);

    expect(getCosmiConfig).toHaveBeenCalledWith(configPath);
  });

  it("normalizes plugins when missing", async () => {
    vi.mocked(getCosmiConfig).mockResolvedValue({
      config: {
        name: "test",
        input: { path: "api.yaml" },
        output: { path: "./gen" },
      },
    } as any);

    await expect(loadConfig("/project/kubb.config.ts")).resolves.toMatchObject({
      plugins: [],
    });
  });
});
