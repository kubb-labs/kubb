import { PackageManager } from "@kubb/core";
import transformers from "@kubb/core/transformers";
import { FunctionParams, URLPath } from "@kubb/core/utils";
import { Editor, File, Function, usePlugin } from "@kubb/react";
import {
  useOperation,
  useOperationFile,
  useOperationName,
  useSchemas,
} from "@kubb/swagger/hooks";
import { getASTParams, getComments, isRequired } from "@kubb/swagger/utils";
import { pluginKey as swaggerTsPluginKey } from "@kubb/swagger-ts";

import { getImportNames } from "../utils.ts";
import { MutationImports } from "./MutationImports.tsx";
import { SchemaType } from "./SchemaType.tsx";

import type { HttpMethod } from "@kubb/swagger/oas";
import type { ReactNode } from "react";
import type { FileMeta, PluginOptions } from "../types.ts";

type TemplateProps = {
  /**
   * Name of the function
   */
  name: string;
  /**
   * Parameters/options/props that need to be used
   */
  params: string;
  mutateParams: string;
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
  hook: {
    name: string;
    generics?: string;
    children?: string;
  };
  client: {
    method: HttpMethod;
    generics: string;
    withQueryParams: boolean;
    withPathParams: boolean;
    withData: boolean;
    withHeaders: boolean;
    path: URLPath;
  };
  dataReturnType: NonNullable<PluginOptions["options"]["dataReturnType"]>;
};

function Template({
  name,
  generics,
  returnType,
  params,
  mutateParams,
  JSDoc,
  client,
  hook,
  dataReturnType,
}: TemplateProps): ReactNode {
  const isV5 = new PackageManager().isValidSync(/@tanstack/, ">=5");
  const clientOptions = [
    `method: "${client.method}"`,
    `url: ${client.path.template}`,
    client.withQueryParams ? "params" : undefined,
    client.withData ? "data" : undefined,
    client.withHeaders
      ? "headers: { ...headers, ...clientOptions.headers }"
      : undefined,
    "...clientOptions",
  ].filter(Boolean);

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`;

  if (isV5) {
    return (
      <Function export name={name} params={params} JSDoc={JSDoc}>
        {`
         const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

         return ${hook.name}({
           mutationFn: async(${mutateParams}) => {
            ${hook.children || ""}
             const res = await client<${client.generics}>({
              ${resolvedClientOptions}
             })

             return ${dataReturnType === "data" ? "res.data" : "res"}
           },
           ...mutationOptions
         })`}
      </Function>
    );
  }

  return (
    <Function
      export
      name={name}
      generics={generics}
      returnType={returnType}
      params={params}
      JSDoc={JSDoc}
    >
      {`
       const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

       return ${hook.name}<${hook.generics}>({
         mutationFn: async(${mutateParams}) => {
          ${hook.children || ""}
           const res = await client<${client.generics}>({
            ${resolvedClientOptions}
           })

           return ${dataReturnType === "data" ? "res.data" : "res"}
         },
         ...mutationOptions
       })`}
    </Function>
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
    return function ({ client, context, ...rest }: FrameworkProps): ReactNode {
      const { factory } = context;

      const importNames = getImportNames();

      const hookName = importNames.mutation.vue.hookName;
      const resultType = importNames.mutation.vue.resultType;
      const optionsType = importNames.mutation.vue.optionsType;
      const schemas = useSchemas();
      const params = new FunctionParams();

      const resultGenerics = [
        `${factory.name}["response"]`,
        `${factory.name}["error"]`,
        client.withData ? `${factory.name}["request"]` : "void",
        "unknown",
      ];

      params.add([
        ...getASTParams(schemas.pathParams, {
          typed: true,
          override: (item) => ({
            ...item,
            name: item.name
              ? `ref${transformers.pascalCase(item.name)}`
              : undefined,
            enabled: !!item.name,
            type: `MaybeRef<${item.type}>`,
          }),
        }),
        {
          name: "refParams",
          type: `MaybeRef<${schemas.queryParams?.name}>`,
          enabled: client.withQueryParams,
          required: isRequired(schemas.queryParams?.schema),
        },
        {
          name: "refHeaders",
          type: `MaybeRef<${schemas.headerParams?.name}>`,
          enabled: client.withHeaders,
          required: isRequired(schemas.headerParams?.schema),
        },
        {
          name: "options",
          type: `{
        mutation?: ${optionsType}<${resultGenerics.join(", ")}>,
        client?: ${factory.name}['client']['parameters']
    }`,
          default: "{}",
        },
      ]);

      const unrefs = params.items
        .filter((item) => item.enabled)
        .map((item) => {
          return item.name
            ? `const ${transformers.camelCase(item.name.replace("ref", ""))} = unref(${item.name})`
            : undefined;
        })
        .join("\n");

      const hook = {
        name: hookName,
        generics: [
          `${factory.name}['response']`,
          `${factory.name}["error"]`,
          client.withData ? `${factory.name}["request"]` : "void",
          "unknown",
        ].join(", "),
        children: unrefs,
      };

      return (
        <>
          <Template
            {...rest}
            mutateParams="data"
            params={params.toString()}
            returnType={`${resultType}<${resultGenerics.join(", ")}>`}
            client={client}
            hook={hook}
          />
        </>
      );
    };
  },
} as const;

type Props = {
  factory: {
    name: string;
  };
  resultType: string;
  hookName: string;
  optionsType: string;
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<FrameworkProps>;
};

export function Mutation({
  factory,
  resultType,
  hookName,
  optionsType,
  Template = defaultTemplates.react,
}: Props): ReactNode {
  // TODO do checks on pathParamsType
  const {
    options: { dataReturnType, mutate },
  } = usePlugin<PluginOptions>();

  if (!mutate) {
    return null;
  }

  const operation = useOperation();
  const name = useOperationName({ type: "function" });
  const schemas = useSchemas();

  const params = new FunctionParams();
  const mutateParams = new FunctionParams();

  const requestType =
    mutate.variablesType === "mutate"
      ? FunctionParams.toObject([
          ...getASTParams(schemas.pathParams, { typed: true }),
          {
            name: "params",
            type: `${factory.name}['queryParams']`,
            enabled: !!schemas.queryParams?.name,
            required: isRequired(schemas.queryParams?.schema),
          },
          {
            name: "headers",
            type: `${factory.name}['headerParams']`,
            enabled: !!schemas.headerParams?.name,
            required: isRequired(schemas.headerParams?.schema),
          },
          {
            name: "data",
            type: `${factory.name}['request']`,
            enabled: !!schemas.request?.name,
            required: isRequired(schemas.request?.schema),
          },
        ])?.type
      : schemas.request?.name
        ? `${factory.name}['request']`
        : "never";

  const client = {
    method: operation.method,
    path: new URLPath(operation.path),
    generics: [
      `${factory.name}["data"]`,
      `${factory.name}["error"]`,
      requestType ? `${factory.name}["request"]` : "void",
    ].join(", "),
    withQueryParams: !!schemas.queryParams?.name,
    withData: !!schemas.request?.name,
    withPathParams: !!schemas.pathParams?.name,
    withHeaders: !!schemas.headerParams?.name,
  };
  const hook = {
    name: hookName,
    generics: [
      `${factory.name}['response']`,
      `${factory.name}["error"]`,
      requestType ? `${requestType}` : "void",
    ].join(", "),
  };

  const resultGenerics = [
    `${factory.name}["response"]`,
    `${factory.name}["error"]`,
    mutate?.variablesType === "mutate"
      ? requestType
      : `${factory.name}["request"]`,
  ];

  if (mutate?.variablesType === "mutate") {
    params.add([
      {
        name: "options",
        type: `{
      mutation?: ${optionsType}<${resultGenerics.join(", ")}>,
      client?: ${factory.name}['client']['parameters']
  }`,
        default: "{}",
      },
    ]);

    mutateParams.add([
      [
        ...getASTParams(schemas.pathParams, { typed: false }),
        {
          name: "params",
          enabled: client.withQueryParams,
          required: isRequired(schemas.queryParams?.schema),
        },
        {
          name: "headers",
          enabled: client.withHeaders,
          required: isRequired(schemas.headerParams?.schema),
        },
        {
          name: "data",
          enabled: !!schemas.request?.name,
          required: isRequired(schemas.request?.schema),
        },
      ],
    ]);
  } else {
    params.add([
      ...getASTParams(schemas.pathParams, { typed: true }),
      {
        name: "params",
        type: `${factory.name}['queryParams']`,
        enabled: client.withQueryParams,
        required: isRequired(schemas.queryParams?.schema),
      },
      {
        name: "headers",
        type: `${factory.name}['headerParams']`,
        enabled: client.withHeaders,
        required: isRequired(schemas.headerParams?.schema),
      },
      {
        name: "options",
        type: `{
      mutation?: ${optionsType}<${resultGenerics.join(", ")}>,
      client?: ${factory.name}['client']['parameters']
  }`,
        default: "{}",
      },
    ]);

    mutateParams.add([
      {
        name: "data",
        enabled: !!schemas.request?.name,
        required: isRequired(schemas.request?.schema),
      },
    ]);
  }

  return (
    <>
      <Template
        name={name}
        JSDoc={{ comments: getComments(operation) }}
        client={client}
        hook={hook}
        params={params.toString()}
        mutateParams={mutateParams.toString()}
        returnType={`${resultType}<${resultGenerics.join(", ")}>`}
        dataReturnType={dataReturnType}
        context={{ factory }}
      />
    </>
  );
}

type FileProps = {
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates;
  /**
   * This will make it possible to override the default behaviour.
   */
  imports?: typeof MutationImports.templates;
};

Mutation.File = function ({
  templates = defaultTemplates,
  imports = MutationImports.templates,
}: FileProps): ReactNode {
  const {
    options: {
      client: { importPath },
      framework,
    },
  } = usePlugin<PluginOptions>();
  const schemas = useSchemas();
  const file = useOperationFile();
  const fileType = useOperationFile({ pluginKey: swaggerTsPluginKey });
  const factoryName = useOperationName({ type: "type" });

  const importNames = getImportNames();
  const Template = templates[framework];
  const Import = imports[framework];
  const factory = {
    name: factoryName,
  };

  return (
    <Editor language="typescript">
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
      >
        <File.Import name={"client"} path={importPath} />
        <File.Import name={["ResponseConfig"]} path={importPath} isTypeOnly />
        <File.Import
          name={[
            schemas.request?.name,
            schemas.response.name,
            schemas.pathParams?.name,
            schemas.queryParams?.name,
            schemas.headerParams?.name,
            ...(schemas.errors?.map((error) => error.name) || []),
          ].filter(Boolean)}
          root={file.path}
          path={fileType.path}
          isTypeOnly
        />
        <MutationImports Template={Import} />
        <File.Source>
          <SchemaType factory={factory} />
          <Mutation
            factory={factory}
            Template={Template}
            hookName={importNames.mutation[framework].hookName}
            resultType={importNames.mutation[framework].resultType}
            optionsType={importNames.mutation[framework].optionsType}
          />
        </File.Source>
      </File>
    </Editor>
  );
};

Mutation.templates = defaultTemplates;
