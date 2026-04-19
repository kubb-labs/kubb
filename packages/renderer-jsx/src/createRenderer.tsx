import type { FileNode } from "@kubb/ast";
import { Runtime } from "./Runtime.tsx";
import type { KubbReactElement } from "./types.ts";

type Options = {
  /**
   * Print each render result to the console for debugging.
   * Useful when diagnosing output differences between renders.
   * @default false
   */
  debug?: boolean;
};

/**
 * The renderer instance returned by {@link createRenderer}.
 */
type Renderer = {
  /**
   * Render a JSX element tree and collect the resulting {@link FileNode} entries.
   * Resolves once all synchronous render work (including React's flush) is done.
   */
  render(Element: KubbReactElement): Promise<void>;
  /**
   * Tear down the renderer and release all React resources.
   * Pass an `Error` to signal an abnormal shutdown.
   */
  unmount(error?: Error | number | null): void;
  /**
   * The {@link FileNode} entries collected from the most recent `render` call.
   */
  files: Array<FileNode>;
};

/**
 * Create a Kubb JSX renderer.
 *
 * The renderer converts a React JSX element tree — built from the components in this
 * package — into an array of {@link FileNode} entries representing the generated files.
 *
 * @example Basic usage
 * ```ts
 * import { createRenderer, File } from '@kubb/renderer-jsx'
 *
 * const renderer = createRenderer()
 * await renderer.render(
 *   <File baseName="pet.ts" path="src/models/pet.ts">
 *     <File.Source name="Pet" isExportable isIndexable>
 *       {`export type Pet = { id: number; name: string }`}
 *     </File.Source>
 *   </File>
 * )
 * console.log(renderer.files) // [FileNode]
 * renderer.unmount()
 * ```
 */
export function createRenderer(options: Options = {}): Renderer {
  const runtime = new Runtime(options);

  return {
    async render(Element) {
      await runtime.render(Element);
    },
    get files() {
      return runtime.nodes;
    },
    unmount(error) {
      runtime.unmount(error);
    },
  };
}

/**
 * A renderer factory for generators that produce JSX output.
 *
 * Pass this as the `renderer` property of a `defineGenerator` call so that
 * core can render the JSX element tree returned by your generator methods
 * without a hard dependency on `@kubb/renderer-jsx`.
 *
 * @example
 * ```ts
 * import { jsxRenderer } from '@kubb/renderer-jsx'
 * import { defineGenerator } from '@kubb/core'
 *
 * export const myGenerator = defineGenerator<PluginTs>({
 *   name: 'my-generator',
 *   renderer: jsxRenderer,
 *   schema(node, options) {
 *     return <File baseName="output.ts" path="src/output.ts">...</File>
 *   },
 * })
 * ```
 */
export const jsxRenderer: () => Renderer = () => createRenderer();
