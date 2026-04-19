import * as React from "react/jsx-runtime";
import type { KubbReactElement, KubbReactNode } from "./types.ts";

export const Fragment = React.Fragment;
export const jsx = React.jsx;
export const jsxDEV = React.jsx;
export const jsxs = React.jsxs;

export type * from "./jsx-namespace.d.ts";

export type JSXElement = KubbReactElement;
export type ReactNode = KubbReactNode;
