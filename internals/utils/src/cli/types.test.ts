import { describe, expect, it, vi } from "vitest";
import { defineCommand } from "./define.ts";

describe("defineCommand", () => {
  it("returns a command without run for parent commands (e.g. agent with subCommands)", () => {
    const sub = defineCommand({ name: "start", description: "Start" });
    const cmd = defineCommand({
      name: "agent",
      description: "Agent",
      subCommands: [sub],
    });
    expect(cmd.run).toBeUndefined();
    expect(cmd.subCommands).toEqual([sub]);
  });

  it("forwards values to the run callback", async () => {
    const runFn = vi.fn();
    const cmd = defineCommand({
      name: "generate",
      description: "Generate",
      options: {
        config: { type: "string", description: "Config path" },
        watch: { type: "boolean", description: "Watch", default: false },
      },
      run: async ({ values }) => {
        runFn(values.config, values.watch);
      },
    });
    await cmd.run?.({
      values: { config: "kubb.config.ts", watch: true },
      positionals: [],
    });
    expect(runFn).toHaveBeenCalledWith("kubb.config.ts", true);
  });

  it("passes positionals to the run callback", async () => {
    const runFn = vi.fn();
    const cmd = defineCommand({
      name: "run",
      description: "Run",
      run: async ({ positionals }) => {
        runFn(positionals);
      },
    });
    await cmd.run?.({ values: {}, positionals: ["file1.ts", "file2.ts"] });
    expect(runFn).toHaveBeenCalledWith(["file1.ts", "file2.ts"]);
  });
});
