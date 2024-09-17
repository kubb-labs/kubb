[API](../../../packages.md) / [@kubb/react](../index.md) / createContext

# createContext()

```ts
function createContext<T>(defaultValue): Context<T>
```

Lets you create a Context that components can provide or read.

## Type Parameters

• **T**

## Parameters

• **defaultValue**: `T`

The value you want the context to have when there is no matching
Provider in the tree above the component reading the context. This is meant
as a "last resort" fallback.

## Returns

`Context`\<`T`\>

## See

 - [React Docs](https://react.dev/reference/react/createContext#reference)
 - [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/)

## Example

```tsx
import { createContext } from 'react';

const ThemeContext = createContext('light');
```

## Defined in

node\_modules/.pnpm/@types+react@18.3.7/node\_modules/@types/react/index.d.ts:774
