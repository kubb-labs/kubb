[API](../../../packages.md) / [@kubb/oas](../index.md) / RequestParams

# RequestParams\<TOAS, TPath, TMethod\>

```ts
type RequestParams<TOAS, TPath, TMethod>: MethodMap<TOAS, TPath>[TMethod] extends Checks["RequestBodyJson"] ? MethodMap<TOAS, TPath>[TMethod]["requestBody"] extends Checks["Required"] ? object : object : MethodMap<TOAS, TPath>[TMethod] extends Checks["RequestBodyFormData"] ? MethodMap<TOAS, TPath>[TMethod]["requestBody"] extends Checks["Required"] ? object : object : MethodMap<TOAS, TPath>[TMethod] extends Checks["RequestBodyFormEncoded"] ? MethodMap<TOAS, TPath>[TMethod]["requestBody"] extends Checks["Required"] ? object : object : object & MethodMap<TOAS, TPath>[TMethod] extends Checks["Parameters"] ? ParamMap<MethodMap<TOAS, TPath>[TMethod]["parameters"]> : object & TPath extends Checks["PathBrackets"] ? object : object & TPath extends Checks["PathPattern"] ? object : object & SecurityParamsBySecurityRef<TOAS, MethodMap<TOAS, TPath>[TMethod]> & SecurityParamsBySecurityRef<TOAS, TOAS>;
```

## Type Parameters

• **TOAS** *extends* [`OASDocument`](../namespaces/OasTypes/type-aliases/OASDocument.md)

• **TPath** *extends* keyof `PathMap`\<`TOAS`\>

• **TMethod** *extends* keyof `MethodMap`\<`TOAS`, `TPath`\>

## Defined in

[packages/oas/src/infer/requestParams.ts:51](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/oas/src/infer/requestParams.ts#L51)
