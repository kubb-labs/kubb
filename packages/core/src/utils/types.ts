// export type Tab = '\u{9}' // '\t'
// export type CariageReturn = '\u{A}' // '\n'
// export type Space = '\u{20}' // ' '

export type Primitive = string | number | boolean | bigint
export type LineBreak = '\r' | '\n'
export type Whitespace = ' ' | '\t' | LineBreak
export type EndOfIdentifier = Whitespace | ',' | ':' | '!'
export type LowerAlphabet =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z'
export type UpperAlphabet =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z'
export type Alphabet = LowerAlphabet | UpperAlphabet
export type Digit = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0'
export type Letter = Alphabet | Digit | '_'
export type StringLine = '"'
export type StringBlock = '"""'
export type CommentToken = '#'

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

export enum Comparison {
  Greater,
  Equal,
  Lower,
}

type Digits<T extends string, S extends 0[][] = [], N extends 0[] = []> = T extends ''
  ? S
  : T extends `${infer F}${infer R}`
  ? `${N['length']}` extends F
    ? Digits<R, [...S, N], []>
    : Digits<T, S, [...N, 0]>
  : any

type CompareLength<A extends 0[][], B extends 0[][], I extends 0[] = []> = A[I['length']] extends 0[]
  ? B[I['length']] extends 0[]
    ? CompareLength<A, B, [0, ...I]>
    : Comparison.Greater
  : B[I['length']] extends 0[]
  ? Comparison.Lower
  : Comparison.Equal

type CompareDigits<A extends 0[][], B extends 0[][], N extends boolean = false, I extends 0[] = [], C extends 0[] = []> = A[I['length']] extends 0[]
  ? C['length'] extends A[I['length']]['length']
    ? C['length'] extends B[I['length']]['length']
      ? CompareDigits<A, B, N, [0, ...I], []>
      : N extends false
      ? Comparison.Lower
      : Comparison.Greater
    : C['length'] extends B[I['length']]['length']
    ? N extends false
      ? Comparison.Greater
      : Comparison.Lower
    : CompareDigits<A, B, N, I, [0, ...C]>
  : Comparison.Equal

export type Comparator<A extends number, B extends number> = A extends B
  ? Comparison.Equal
  : `${A}` extends `-${infer a}`
  ? `${B}` extends `-${infer b}`
    ? CompareLength<Digits<`${a}`>, Digits<`${b}`>> extends Comparison.Equal
      ? CompareDigits<Digits<`${a}`>, Digits<`${b}`>, true>
      : CompareLength<Digits<`${a}`>, Digits<`${b}`>> extends Comparison.Greater
      ? Comparison.Lower
      : Comparison.Greater
    : Comparison.Lower
  : `${B}` extends `-${any}`
  ? Comparison.Greater
  : CompareLength<Digits<`${A}`>, Digits<`${B}`>> extends Comparison.Equal
  ? CompareDigits<Digits<`${A}`>, Digits<`${B}`>>
  : CompareLength<Digits<`${A}`>, Digits<`${B}`>>
