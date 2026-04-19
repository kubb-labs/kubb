import { describe, expect, it, vi } from "vitest";
import { createCLI } from "./parse.ts";
import type { CLIAdapter, CommandDefinition, RunOptions } from "./types.ts";

const opts: RunOptions = {
  programName: "kubb",
  defaultCommandName: "generate",
  version: "1.0.0",
};

describe("createCLI", () => {
  it("uses the nodeAdapter by default", async () => {
    vi.spyOn(process, "exit").mockImplementation(
      (code?: string | number | null) => {
        throw new Error(`exit:${code ?? 0}`);
      },
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
    const commands: CommandDefinition[] = [
      { name: "generate", description: "Generate" },
    ];
    await expect(
      createCLI().run(commands, ["--version"], opts),
    ).rejects.toThrow("exit:0");
    vi.restoreAllMocks();
  });

  it("delegates run to a custom adapter", async () => {
    const mockRun = vi.fn().mockResolvedValue(undefined);
    const adapter: CLIAdapter = { run: mockRun, renderHelp: vi.fn() };
    const commands: CommandDefinition[] = [
      { name: "generate", description: "Generate" },
    ];
    const argv = ["generate"];

    await createCLI({ adapter }).run(commands, argv, opts);

    expect(mockRun).toHaveBeenCalledWith(commands, argv, opts);
  });
});
