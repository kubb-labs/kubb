import { parseArgs, styleText } from "node:util";
import { defineCLIAdapter } from "../define.ts";
import { renderHelp } from "../help.ts";
import type {
  CommandDefinition,
  OptionType,
  ParsedArgs,
  RunOptions,
} from "../types.ts";

type ParseOption = {
  type: OptionType;
  short?: string;
  default?: string | boolean;
};
type ParseOptions = Record<string, ParseOption>;

function buildParseOptions(def: CommandDefinition): ParseOptions {
  const result: ParseOptions = {
    help: { type: "boolean", short: "h" },
  };

  for (const [name, opt] of Object.entries(def.options ?? {})) {
    result[name] = {
      type: opt.type,
      ...(opt.short ? { short: opt.short } : {}),
      ...(opt.default !== undefined ? { default: opt.default } : {}),
    };
  }

  return result;
}

async function runCommand(
  def: CommandDefinition,
  argv: string[],
  parentName?: string,
): Promise<void> {
  const parseOptions = buildParseOptions(def);

  let parsed: ParsedArgs;
  try {
    const result = parseArgs({
      args: argv,
      options: parseOptions,
      allowPositionals: true,
      strict: false,
    });
    parsed = {
      values: result.values as ParsedArgs["values"],
      positionals: result.positionals,
    };
  } catch {
    renderHelp(def, parentName);
    process.exit(1);
  }

  if (parsed.values["help"]) {
    renderHelp(def, parentName);
    process.exit(0);
  }

  // Validate required options before running the command
  for (const [name, opt] of Object.entries(def.options ?? {})) {
    if (opt.required && parsed.values[name] === undefined) {
      console.error(styleText("red", `Error: --${name} is required`));
      renderHelp(def, parentName);
      process.exit(1);
    }
  }

  if (!def.run) {
    renderHelp(def, parentName);
    process.exit(0);
  }

  try {
    await def.run(parsed);
  } catch (err) {
    console.error(
      styleText(
        "red",
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      ),
    );
    renderHelp(def, parentName);
    process.exit(1);
  }
}

function printRootHelp(
  programName: string,
  version: string,
  defs: CommandDefinition[],
): void {
  console.log(
    `\n${styleText("bold", "Usage:")} ${programName} <command> [options]\n`,
  );
  console.log(`  Kubb generation — v${version}\n`);
  console.log(styleText("bold", "Commands:"));
  for (const def of defs) {
    console.log(
      `  ${styleText("cyan", def.name.padEnd(16))}${def.description}`,
    );
  }
  console.log();
  console.log(styleText("bold", "Options:"));
  console.log(
    `  ${styleText("cyan", "-v, --version".padEnd(30))}Show version number`,
  );
  console.log(`  ${styleText("cyan", "-h, --help".padEnd(30))}Show help`);
  console.log();
  console.log(
    `Run ${styleText("cyan", `${programName} <command> --help`)} for command-specific help.\n`,
  );
}

/**
 * CLI adapter using `node:util parseArgs`. No external dependencies.
 */
export const nodeAdapter = defineCLIAdapter({
  renderHelp(def: CommandDefinition, parentName?: string): void {
    renderHelp(def, parentName);
  },

  async run(
    defs: CommandDefinition[],
    argv: string[],
    opts: RunOptions,
  ): Promise<void> {
    const { programName, defaultCommandName, version } = opts;

    const args =
      argv.length >= 2 && argv[0]?.includes("node") ? argv.slice(2) : argv;

    if (args[0] === "--version" || args[0] === "-v") {
      console.log(version);
      process.exit(0);
    }

    if (args[0] === "--help" || args[0] === "-h") {
      printRootHelp(programName, version, defs);
      process.exit(0);
    }

    if (args.length === 0) {
      const defaultDef = defs.find((d) => d.name === defaultCommandName);
      if (defaultDef?.run) {
        await runCommand(defaultDef, [], programName);
      } else {
        printRootHelp(programName, version, defs);
      }
      return;
    }

    const [first, ...rest] = args;
    const isKnownSubcommand = defs.some((d) => d.name === first);

    let def: CommandDefinition | undefined;
    let commandArgv: string[];
    let parentName: string | undefined;

    if (isKnownSubcommand) {
      def = defs.find((d) => d.name === first);
      commandArgv = rest;
      parentName = programName;
    } else {
      def = defs.find((d) => d.name === defaultCommandName);
      commandArgv = args;
      parentName = programName;
    }

    if (!def) {
      console.error(`Unknown command: ${first}`);
      printRootHelp(programName, version, defs);
      process.exit(1);
    }

    if (def.subCommands?.length) {
      const [subName, ...subRest] = commandArgv;
      const subDef = def.subCommands.find((s) => s.name === subName);

      if (subName === "--help" || subName === "-h") {
        renderHelp(def, parentName);
        process.exit(0);
      }

      if (!subDef) {
        renderHelp(def, parentName);
        process.exit(subName ? 1 : 0);
      }

      await runCommand(subDef, subRest, `${parentName} ${def.name}`);
      return;
    }

    await runCommand(def, commandArgv, parentName);
  },
});
