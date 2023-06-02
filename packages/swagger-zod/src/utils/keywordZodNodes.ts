export const keywordZodNodes = {
  any: 'z.any',
  number: 'z.number',
  integer: 'z.number',
  object: 'z.object',
  lazy: 'z.lazy',
  string: 'z.string',
  boolean: 'z.boolean',
  undefined: 'z.undefined',
  null: '.nullable',
  array: 'z.array',
  tuple: 'z.tuple',
  enum: 'z.enum',
  union: 'z.union',
  /* intersection */
  and: '.and',
  describe: '.describe',
  min: '.min',
  max: '.max',
  optional: '.optional',
  catchall: '.catchall',

  // custom ones
  ref: 'ref',
  matches: '.regex',
} as const

export type KeywordZodNode = keyof typeof keywordZodNodes
export type KeywordZodNodes = (typeof keywordZodNodes)[KeywordZodNode]
