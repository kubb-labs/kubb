import type {
  ArrowFunctionNode,
  ConstNode,
  ExportNode,
  FileNode,
  FunctionNode,
  ImportNode,
  SourceNode,
  TypeNode,
} from "@kubb/ast";
import type React from "react";
import type { JSX, ReactNode } from "react";

/**
 * React reconciliation key type.
 * Used to uniquely identify elements in lists and conditional renders.
 */
export type Key = string | number | bigint;

/**
 * All custom element names recognized by the Kubb JSX renderer.
 * Each name maps to a corresponding AST node type emitted during code generation.
 */
export type ElementNames =
  | "br"
  | "div"
  | "indent"
  | "dedent"
  | "kubb-jsx"
  | "kubb-text"
  | "kubb-file"
  | "kubb-source"
  | "kubb-import"
  | "kubb-export"
  | "kubb-function"
  | "kubb-arrow-function"
  | "kubb-const"
  | "kubb-type"
  | "kubb-root"
  | "kubb-app";

type Node = {
  parentNode: DOMElement | undefined;
  internal_static?: boolean;
};

/**
 * Allowed attribute value types stored on a {@link DOMElement}.
 * Corresponds to the range of prop values JSX components may pass to intrinsic elements.
 */
export type DOMNodeAttribute =
  | boolean
  | string
  | number
  | Record<string, unknown>
  | Array<unknown>;

type TextName = "#text";

/**
 * A leaf DOM node that holds a raw text string.
 * Created by the renderer whenever a JSX expression produces a plain string child.
 */
export type TextNode = {
  nodeName: TextName;
  nodeValue: string;
} & Node;

/**
 * Discriminated union of all virtual DOM nodes.
 * Resolves to {@link TextNode} when `nodeName` is `'#text'`, or {@link DOMElement} for
 * any named Kubb element.
 */
export type DOMNode<T = { nodeName: NodeNames }> = T extends {
  nodeName: infer U;
}
  ? U extends "#text"
    ? TextNode
    : DOMElement
  : never;

type OutputTransformer = (s: string, index: number) => string;

/**
 * A named element node in the Kubb virtual DOM tree.
 * Holds attributes, child nodes, and optional lifecycle callbacks used by the renderer.
 */
export type DOMElement = {
  nodeName: ElementNames;
  /**
   * Key/value attributes passed as JSX props to this element.
   */
  attributes: Map<string, DOMNodeAttribute>;
  /**
   * Ordered list of child nodes attached to this element.
   */
  childNodes: DOMNode[];
  internal_transform?: OutputTransformer;

  // Internal properties
  isStaticDirty?: boolean;
  staticNode?: DOMElement;
  onComputeLayout?: () => void;
  onRender?: () => void;
  onImmediateRender?: () => void;
} & Node;

type NodeNames = ElementNames | TextName;

/**
 * React node type used throughout Kubb JSX components.
 * Alias for React's `ReactNode`.
 */
export type KubbReactNode = ReactNode;

/**
 * React element type returned by Kubb JSX components.
 * Alias for `JSX.Element`.
 */
export type KubbReactElement = JSX.Element;

/**
 * Props for the `<kubb-jsx>` intrinsic element.
 * Embeds a raw JSX string verbatim in the generated source.
 */
export type KubbJsxProps = {
  children?: string;
};

/**
 * Props for the `<kubb-text>` intrinsic element.
 * Wraps arbitrary React children as plain text in the output.
 */
export type KubbTextProps = {
  children?: KubbReactNode;
};

/**
 * Props for the `<kubb-file>` intrinsic element.
 * Represents a generated file entry collected by the renderer.
 */
export type KubbFileProps = {
  id?: string;
  children?: KubbReactNode;
  baseName: string;
  path: string;
  override?: boolean;
  meta?: FileNode["meta"];
};

/**
 * Props for the `<kubb-source>` intrinsic element.
 * Marks a block of source text associated with the enclosing file.
 */
export type KubbSourceProps = Omit<SourceNode, "kind"> & {
  children?: KubbReactNode;
};

/**
 * Props for the `<kubb-import>` intrinsic element.
 * Declares an import entry for the enclosing file.
 */
export type KubbImportProps = Omit<ImportNode, "kind"> & {};

/**
 * Props for the `<kubb-export>` intrinsic element.
 * Declares an export entry for the enclosing file.
 */
export type KubbExportProps = Omit<ExportNode, "kind"> & {};

/**
 * Props for the `<kubb-function>` intrinsic element.
 * Describes a function declaration node in the generated output.
 */
export type KubbFunctionProps = Omit<FunctionNode, "kind"> & {
  children?: KubbReactNode;
};

/**
 * Props for the `<kubb-arrow-function>` intrinsic element.
 * Describes an arrow function declaration node in the generated output.
 */
export type KubbArrowFunctionProps = Omit<ArrowFunctionNode, "kind"> & {
  children?: KubbReactNode;
};

/**
 * Props for the `<kubb-const>` intrinsic element.
 * Describes a constant declaration node in the generated output.
 */
export type KubbConstProps = Omit<ConstNode, "kind"> & {
  children?: KubbReactNode;
};

/**
 * Props for the `<kubb-type>` intrinsic element.
 * Describes a TypeScript type alias declaration node in the generated output.
 */
export type KubbTypeProps = Omit<TypeNode, "kind"> & {
  children?: KubbReactNode;
};

/**
 * Props forwarded to the HTML `<br>` element within intrinsic element declarations.
 */
export type LineBreakProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLBRElement>,
  HTMLBRElement
>;

/**
 * JSDoc block to attach to a generated declaration.
 *
 * Each string in `comments` becomes one line inside the emitted `/** … *\/` block.
 *
 * @example
 * ```ts
 * { comments: ['@description A pet object.', '@deprecated Use PetV2 instead.'] }
 * // Emits:
 * // /**
 * //  * @description A pet object.
 * //  * @deprecated Use PetV2 instead.
 * //  *\/
 * ```
 */
export type JSDoc = {
  /**
   * Lines to emit inside the JSDoc block, in source order.
   * Use standard JSDoc tags such as `@description`, `@deprecated`, `@see`, etc.
   */
  comments: Array<string>;
};
