/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

type Environments = import('./src/types.ts').Environments

declare module 'global' {
  namespace NodeJS {
    export interface ProcessEnv extends Partial<Record<keyof Environments, string>> {}
  }
}
/**
 * `tsconfig.json`
 * @example 
"compilerOptions": {
___ "types": ["@kubb/swagger-client/globals"]
}
 * @example implementation
{
___ env?: NodeJS.ProcessEnv
}
*/
declare namespace NodeJS {
  export interface ProcessEnv extends Partial<Record<keyof Environments, string>> {}
}
