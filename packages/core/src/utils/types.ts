// export type Tab = '\u{9}' // '\t'
// export type CariageReturn = '\u{A}' // '\n'
// export type Space = '\u{20}' // ' '

export type Primitive = string | number | boolean | bigint
export type LineBreak = '\r' | '\n'
export type Whitespace = ' ' | '\t' | LineBreak
export type EndOfIdentifier = Whitespace | ',' | ':' | '!'

type RemoveSingleLineComment<T extends string> = T extends `${infer First}#${infer _Comment}\n${infer Rest}` ? `${First}${RemoveSingleLineComment<Rest>}` : T

type RemoveMultiLineComment<T extends string> = T extends `${infer First}"""${infer _Comment}"""${infer Rest}` ? `${First}${RemoveMultiLineComment<Rest>}` : T
export type RemoveComment<T extends string> = RemoveMultiLineComment<RemoveSingleLineComment<T>>

export type ReplaceAll<S extends string, From extends string, To extends string> = S extends `${infer R1}${From}${infer R2}`
  ? `${R1}${To}${ReplaceAll<R2, From, To>}`
  : S

export type Prettify<T> = {
  [K in keyof T]: T[K]
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {}

export type Debug<T, Debug extends boolean> = Prettify<Omit<T, Debug extends true ? '' : 'debug'>>
export type PossiblePromise<T> = Promise<T> | T
