export const keywordZodNodes = {
  any: 'any',
  number: 'z.number',
  integer: 'z.number',
  object: 'z.object',
  string: 'z.string',
  boolean: 'z.boolean',
  undefined: 'z.undefined',
  null: 'z.null',
  array: 'z.array',
  enum: 'z.enum',
  union: 'z.union',
  /* intersection */
  and: '.and',
  describe: '.describe',
  min: '.min',
  max: '.max',
  optional: '.optional',

  // custom ones
  ref: 'ref',
  matches: 'matches',
} as const
