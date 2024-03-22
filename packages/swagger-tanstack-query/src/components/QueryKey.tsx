import { FunctionParams, URLPath } from "@kubb/core/utils";
import { Function, Type, usePlugin } from "@kubb/react";
import { useOperation, useSchemas } from "@kubb/swagger/hooks";
import { getASTParams, isRequired } from "@kubb/swagger/utils";

import type { ReactNode } from "react";
import type { PluginOptions } from "../types";

type TemplateProps = {
  /**
   * Name of the function
   */
  name: string;
  /**
   * TypeName of the function in PascalCase
   */
  typeName: string;
  /**
   * Parameters/options/props that need to be used
   */
  params: string;
  /**
   * Generics that needs to be added for TypeScript
   */
  generics?: string;
  /**
   * ReturnType(see async for adding Promise type)
   */
  returnType?: string;
  /**
   * Options for JSdocs
   */
  JSDoc?: {
    comments: string[];
  };
  keys?: string;
};

function Template({
  name,
  typeName,
  params,
  generics,
  returnType,
  JSDoc,
  keys,
}: TemplateProps): ReactNode {
  return (
    <>
      <Function.Arrow
        name={name}
        export
        generics={generics}
        params={params}
        returnType={returnType}
        singleLine
        JSDoc={JSDoc}
      >
        {`[${keys}] as const`}
      </Function.Arrow>

      <Type name={typeName} export>
        {`ReturnType<typeof ${name}>`}
      </Type>
    </>
  );
}

type FrameworkProps = TemplateProps & {
  context: {
    factory: {
      name: string;
    };
  };
};

const defaultTemplates = {
  get react() {
    return function (props: FrameworkProps): ReactNode {
      return <Template {...props} />;
    };
  },
  get solid() {
    return function (props: FrameworkProps): ReactNode {
      return <Template {...props} />;
    };
  },
  get svelte() {
    return function (props: FrameworkProps): ReactNode {
      return <Template {...props} />;
    };
  },
  get vue() {
    return function ({ context, ...rest }: FrameworkProps): ReactNode {
      const { factory } = context;

      const {
        options: { pathParamsType },
      } = usePlugin<PluginOptions>();
      const schemas = useSchemas();
      const operation = useOperation();
      const path = new URLPath(operation.path);
      const params = new FunctionParams();
      const withQueryParams = !!schemas.queryParams?.name;

      params.add([
        ...getASTParams(schemas.pathParams, {
          typed: true,
          asObject: pathParamsType === "object",
          override: (item) => ({ ...item, type: `MaybeRef<${item.type}>` }),
        }),
        {
          name: "params",
          type: schemas.queryParams?.name
            ? `MaybeRef<${`${factory.name}["queryParams"]`}>`
            : undefined,
          enabled: !!schemas.queryParams?.name,
          required: isRequired(schemas.queryParams?.schema),
        },
      ]);

      const keys = [
        path.toObject({
          type: "path",
          stringify: true,
          replacer: (pathParam) => `unref(${pathParam})`,
        }),
        withQueryParams ? `...(params ? [params] : [])` : undefined,
      ].filter(Boolean);

      return (
        <Template {...rest} params={params.toString()} keys={keys.join(", ")} />
      );
    };
  },
} as const;

type Props = {
  name: string;
  typeName: string;
  keysFn: (keys: unknown[]) => unknown[];
  factory: {
    name: string;
  };
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<FrameworkProps>;
};

export function QueryKey({
  name,
  typeName,
  factory,
  keysFn,
  Template = defaultTemplates.react,
}: Props): ReactNode {
  const {
    options: { pathParamsType },
  } = usePlugin<PluginOptions>();
  const schemas = useSchemas();
  const operation = useOperation();
  const path = new URLPath(operation.path);
  const params = new FunctionParams();
  const withQueryParams = !!schemas.queryParams?.name;

  params.add([
    ...getASTParams(schemas.pathParams, {
      typed: true,
      asObject: pathParamsType === "object",
    }),
    {
      name: "params",
      type: `${factory.name}["queryParams"]`,
      enabled: !!schemas.queryParams?.name,
      required: isRequired(schemas.queryParams?.schema),
    },
  ]);

  const keys = [
    path.toObject({
      type: "path",
      stringify: true,
    }),
    withQueryParams ? `...(params ? [params] : [])` : undefined,
  ].filter(Boolean);

  return (
    <Template
      typeName={typeName}
      name={name}
      params={params.toString()}
      keys={keysFn(keys).join(", ")}
      context={{ factory }}
    />
  );
}

QueryKey.templates = defaultTemplates;
