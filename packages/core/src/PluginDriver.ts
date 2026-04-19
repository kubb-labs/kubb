import { extname, resolve } from "node:path";
import type { AsyncEventEmitter } from "@internals/utils";
import type { FileNode, InputNode, OperationNode, SchemaNode } from "@kubb/ast";
import { createFile } from "@kubb/ast";
import { DEFAULT_STUDIO_URL } from "./constants.ts";
import type { Generator } from "./defineGenerator.ts";
import type { Plugin } from "./definePlugin.ts";
import { defineResolver } from "./defineResolver.ts";
import { openInStudio as openInStudioFn } from "./devtools.ts";
import { FileManager } from "./FileManager.ts";
import { applyHookResult } from "./renderNode.ts";

import type {
  Adapter,
  Config,
  DevtoolsOptions,
  GeneratorContext,
  KubbHooks,
  KubbPluginSetupContext,
  NormalizedPlugin,
  PluginFactoryOptions,
  Resolver,
} from "./types.ts";

// inspired by: https://github.com/rollup/rollup/blob/master/src/utils/PluginDriver.ts#

type Options = {
  hooks: AsyncEventEmitter<KubbHooks>;
};

export class PluginDriver {
  readonly config: Config;
  readonly options: Options;

  /**
   * Returns `'single'` when `fileOrFolder` has a file extension, `'split'` otherwise.
   *
   * @example
   * ```ts
   * PluginDriver.getMode('src/gen/types.ts')  // 'single'
   * PluginDriver.getMode('src/gen/types')     // 'split'
   * ```
   */
  static getMode(fileOrFolder: string | undefined | null): "single" | "split" {
    if (!fileOrFolder) {
      return "split";
    }
    return extname(fileOrFolder) ? "single" : "split";
  }

  /**
   * The universal `@kubb/ast` `InputNode` produced by the adapter, set by
   * the build pipeline after the adapter's `parse()` resolves.
   */
  inputNode: InputNode | undefined = undefined;
  adapter: Adapter | undefined = undefined;
  #studioIsOpen = false;

  /**
   * Central file store for all generated files.
   * Plugins should use `this.addFile()` / `this.upsertFile()` (via their context) to
   * add files; this property gives direct read/write access when needed.
   */
  readonly fileManager = new FileManager();

  readonly plugins = new Map<string, NormalizedPlugin>();

  /**
   * Tracks which plugins have generators registered via `addGenerator()` (event-based path).
   * Used by the build loop to decide whether to emit generator events for a given plugin.
   */
  readonly #pluginsWithEventGenerators = new Set<string>();
  readonly #resolvers = new Map<string, Resolver>();
  readonly #defaultResolvers = new Map<string, Resolver>();
  readonly #hookListeners = new Map<
    keyof KubbHooks,
    Set<(...args: never[]) => void | Promise<void>>
  >();

  constructor(config: Config, options: Options) {
    this.config = config;
    this.options = options;
    config.plugins
      .map((rawPlugin) => this.#normalizePlugin(rawPlugin as Plugin))
      .filter((plugin) => {
        if (typeof plugin.apply === "function") {
          return plugin.apply(config);
        }
        return true;
      })
      .sort((a, b) => {
        if (b.dependencies?.includes(a.name)) return -1;
        if (a.dependencies?.includes(b.name)) return 1;
        return 0;
      })
      .forEach((plugin) => {
        this.plugins.set(plugin.name, plugin);
      });
  }

  get hooks() {
    return this.options.hooks;
  }

  /**
   * Creates an `NormalizedPlugin` from a hook-style plugin and registers
   * its lifecycle handlers on the `AsyncEventEmitter`.
   */
  #normalizePlugin(hookPlugin: Plugin): NormalizedPlugin {
    const normalizedPlugin = {
      name: hookPlugin.name,
      dependencies: hookPlugin.dependencies,
      options: { output: { path: "." }, exclude: [], override: [] },
    } as unknown as NormalizedPlugin;

    this.registerPluginHooks(hookPlugin, normalizedPlugin);
    return normalizedPlugin;
  }

  /**
   * Registers a hook-style plugin's lifecycle handlers on the shared `AsyncEventEmitter`.
   *
   * For `kubb:plugin:setup`, the registered listener wraps the globally emitted context with a
   * plugin-specific one so that `addGenerator`, `setResolver`, `setTransformer`, and
   * `setRenderer` all target the correct `normalizedPlugin` entry in the plugins map.
   *
   * All other hooks are iterated and registered directly as pass-through listeners.
   * Any event key present in the global `KubbHooks` interface can be subscribed to.
   *
   * External tooling can subscribe to any of these events via `hooks.on(...)` to observe
   * the plugin lifecycle without modifying plugin behavior.
   *
   * @internal
   */
  registerPluginHooks(
    hookPlugin: Plugin,
    normalizedPlugin: NormalizedPlugin,
  ): void {
    const { hooks } = hookPlugin;

    // kubb:plugin:setup gets special treatment: the globally emitted context is wrapped with
    // plugin-specific implementations so that addGenerator / setResolver / etc. target
    // this plugin's normalizedPlugin entry rather than being no-ops.
    if (hooks["kubb:plugin:setup"]) {
      const setupHandler = (globalCtx: KubbPluginSetupContext) => {
        const pluginCtx: KubbPluginSetupContext = {
          ...globalCtx,
          options: hookPlugin.options ?? {},
          addGenerator: (gen) => {
            this.registerGenerator(normalizedPlugin.name, gen);
          },
          setResolver: (resolver) => {
            this.setPluginResolver(normalizedPlugin.name, resolver);
          },
          setTransformer: (visitor) => {
            normalizedPlugin.transformer = visitor;
          },
          setRenderer: (renderer) => {
            normalizedPlugin.renderer = renderer;
          },
          setOptions: (opts) => {
            normalizedPlugin.options = { ...normalizedPlugin.options, ...opts };
          },
          injectFile: ({ sources = [], ...rest }) => {
            this.fileManager.add(
              createFile({ imports: [], exports: [], sources, ...rest }),
            );
          },
        };
        return hooks["kubb:plugin:setup"]!(pluginCtx);
      };

      this.hooks.on("kubb:plugin:setup", setupHandler);
      this.#trackHookListener(
        "kubb:plugin:setup",
        setupHandler as (...args: never[]) => void | Promise<void>,
      );
    }

    // All other hooks are registered as direct pass-through listeners on the shared emitter.
    for (const [event, handler] of Object.entries(hooks) as Array<
      [
        keyof KubbHooks,
        ((...args: never[]) => void | Promise<void>) | undefined,
      ]
    >) {
      if (event === "kubb:plugin:setup" || !handler) continue;

      this.hooks.on(event, handler as never);
      this.#trackHookListener(
        event,
        handler as (...args: never[]) => void | Promise<void>,
      );
    }
  }

  /**
   * Emits the `kubb:plugin:setup` event so that all registered hook-style plugin listeners
   * can configure generators, resolvers, transformers and renderers before `buildStart` runs.
   *
   * Call this once from `safeBuild` before the plugin execution loop begins.
   */
  async emitSetupHooks(): Promise<void> {
    const noop = () => {};
    await this.hooks.emit("kubb:plugin:setup", {
      config: this.config,
      options: {},
      addGenerator: noop,
      setResolver: noop,
      setTransformer: noop,
      setRenderer: noop,
      setOptions: noop,
      injectFile: noop,
      updateConfig: noop,
    });
  }

  /**
   * Registers a generator for the given plugin on the shared event emitter.
   *
   * The generator's `schema`, `operation`, and `operations` methods are registered as
   * listeners on `kubb:generate:schema`, `kubb:generate:operation`, and `kubb:generate:operations`
   * respectively. Each listener is scoped to the owning plugin via a `ctx.plugin.name` check
   * so that generators from different plugins do not cross-fire.
   *
   * The renderer resolution chain is: `generator.renderer → plugin.renderer → config.renderer`.
   * Set `generator.renderer = null` to explicitly opt out of rendering even when the plugin
   * declares a renderer.
   *
   * Call this method inside `addGenerator()` (in `kubb:plugin:setup`) to wire up a generator.
   */
  registerGenerator(pluginName: string, gen: Generator): void {
    const resolveRenderer = () => {
      const plugin = this.plugins.get(pluginName);
      return gen.renderer === null
        ? undefined
        : (gen.renderer ?? plugin?.renderer ?? this.config.renderer);
    };

    if (gen.schema) {
      const schemaHandler = async (node: SchemaNode, ctx: GeneratorContext) => {
        if (ctx.plugin.name !== pluginName) return;
        const result = await gen.schema!(node, ctx);
        await applyHookResult(result, this, resolveRenderer());
      };

      this.hooks.on("kubb:generate:schema", schemaHandler);
      this.#trackHookListener(
        "kubb:generate:schema",
        schemaHandler as (...args: never[]) => void | Promise<void>,
      );
    }

    if (gen.operation) {
      const operationHandler = async (
        node: OperationNode,
        ctx: GeneratorContext,
      ) => {
        if (ctx.plugin.name !== pluginName) return;
        const result = await gen.operation!(node, ctx);
        await applyHookResult(result, this, resolveRenderer());
      };

      this.hooks.on("kubb:generate:operation", operationHandler);
      this.#trackHookListener(
        "kubb:generate:operation",
        operationHandler as (...args: never[]) => void | Promise<void>,
      );
    }

    if (gen.operations) {
      const operationsHandler = async (
        nodes: Array<OperationNode>,
        ctx: GeneratorContext,
      ) => {
        if (ctx.plugin.name !== pluginName) return;
        const result = await gen.operations!(nodes, ctx);
        await applyHookResult(result, this, resolveRenderer());
      };

      this.hooks.on("kubb:generate:operations", operationsHandler);
      this.#trackHookListener(
        "kubb:generate:operations",
        operationsHandler as (...args: never[]) => void | Promise<void>,
      );
    }

    this.#pluginsWithEventGenerators.add(pluginName);
  }

  /**
   * Returns `true` when at least one generator was registered for the given plugin
   * via `addGenerator()` in `kubb:plugin:setup` (event-based path).
   *
   * Used by the build loop to decide whether to walk the AST and emit generator events
   * for a plugin that has no static `plugin.generators`.
   */
  hasRegisteredGenerators(pluginName: string): boolean {
    return this.#pluginsWithEventGenerators.has(pluginName);
  }

  /**
   * Unregisters all plugin lifecycle listeners from the shared event emitter.
   * Called at the end of a build to prevent listener leaks across repeated builds.
   *
   * @internal
   */
  dispose(): void {
    for (const [event, handlers] of this.#hookListeners) {
      for (const handler of handlers) {
        this.hooks.off(event, handler as never);
      }
    }
    this.#hookListeners.clear();
    this.#pluginsWithEventGenerators.clear();
  }

  #trackHookListener(
    event: keyof KubbHooks,
    handler: (...args: never[]) => void | Promise<void>,
  ): void {
    let handlers = this.#hookListeners.get(event);
    if (!handlers) {
      handlers = new Set();
      this.#hookListeners.set(event, handlers);
    }
    handlers.add(handler);
  }

  #createDefaultResolver(pluginName: string): Resolver {
    const existingResolver = this.#defaultResolvers.get(pluginName);
    if (existingResolver) {
      return existingResolver;
    }

    const resolver = defineResolver<PluginFactoryOptions>(() => ({
      name: "default",
      pluginName,
    }));
    this.#defaultResolvers.set(pluginName, resolver);
    return resolver;
  }

  /**
   * Merges `partial` with the plugin's default resolver and stores the result.
   * Also mirrors it onto `plugin.resolver` so callers using `getPlugin(name).resolver`
   * get the up-to-date resolver without going through `getResolver()`.
   */
  setPluginResolver(pluginName: string, partial: Partial<Resolver>): void {
    const defaultResolver = this.#createDefaultResolver(pluginName);
    const merged = { ...defaultResolver, ...partial };
    this.#resolvers.set(pluginName, merged);
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      plugin.resolver = merged;
    }
  }

  /**
   * Returns the resolver for the given plugin.
   *
   * Resolution order: dynamic resolver set via `setPluginResolver` → static resolver on the
   * plugin → lazily created default resolver (identity name, no path transforms).
   */
  getResolver<TName extends keyof Kubb.PluginRegistry>(
    pluginName: TName,
  ): Kubb.PluginRegistry[TName]["resolver"];
  getResolver<TResolver extends Resolver = Resolver>(
    pluginName: string,
  ): TResolver;
  getResolver(pluginName: string): Resolver {
    return (
      this.#resolvers.get(pluginName) ??
      this.plugins.get(pluginName)?.resolver ??
      this.#createDefaultResolver(pluginName)
    );
  }

  getContext<TOptions extends PluginFactoryOptions>(
    plugin: NormalizedPlugin<TOptions>,
  ): GeneratorContext<TOptions> & Record<string, unknown> {
    const driver = this;

    const baseContext = {
      config: driver.config,
      get root(): string {
        return resolve(driver.config.root, driver.config.output.path);
      },
      getMode(output: { path: string }): "single" | "split" {
        return PluginDriver.getMode(
          resolve(driver.config.root, driver.config.output.path, output.path),
        );
      },
      hooks: driver.hooks,
      plugin,
      getPlugin: driver.getPlugin.bind(driver),
      requirePlugin: driver.requirePlugin.bind(driver),
      getResolver: driver.getResolver.bind(driver),
      driver,
      addFile: async (...files: Array<FileNode>) => {
        driver.fileManager.add(...files);
      },
      upsertFile: async (...files: Array<FileNode>) => {
        driver.fileManager.upsert(...files);
      },
      get inputNode(): InputNode | undefined {
        return driver.inputNode;
      },
      get adapter(): Adapter | undefined {
        return driver.adapter;
      },
      get resolver() {
        return driver.getResolver(plugin.name);
      },
      get transformer() {
        return plugin.transformer;
      },
      warn(message: string) {
        driver.hooks.emit("kubb:warn", message);
      },
      error(error: string | Error) {
        driver.hooks.emit(
          "kubb:error",
          typeof error === "string" ? new Error(error) : error,
        );
      },
      info(message: string) {
        driver.hooks.emit("kubb:info", message);
      },
      openInStudio(options?: DevtoolsOptions) {
        if (!driver.config.devtools || driver.#studioIsOpen) {
          return;
        }

        if (typeof driver.config.devtools !== "object") {
          throw new Error("Devtools must be an object");
        }

        if (!driver.inputNode || !driver.adapter) {
          throw new Error(
            "adapter is not defined, make sure you have set the parser in kubb.config.ts",
          );
        }

        driver.#studioIsOpen = true;

        const studioUrl =
          driver.config.devtools?.studioUrl ?? DEFAULT_STUDIO_URL;

        return openInStudioFn(driver.inputNode, studioUrl, options);
      },
    } as unknown as GeneratorContext<TOptions>;

    return baseContext;
  }

  getPlugin<TName extends keyof Kubb.PluginRegistry>(
    pluginName: TName,
  ): Plugin<Kubb.PluginRegistry[TName]> | undefined;
  getPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(
    pluginName: string,
  ): Plugin<TOptions> | undefined;
  getPlugin(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * Like `getPlugin` but throws a descriptive error when the plugin is not found.
   */
  requirePlugin<TName extends keyof Kubb.PluginRegistry>(
    pluginName: TName,
  ): Plugin<Kubb.PluginRegistry[TName]>;
  requirePlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(
    pluginName: string,
  ): Plugin<TOptions>;
  requirePlugin(pluginName: string): Plugin {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(
        `[kubb] Plugin "${pluginName}" is required but not found. Make sure it is included in your Kubb config.`,
      );
    }
    return plugin;
  }
}
