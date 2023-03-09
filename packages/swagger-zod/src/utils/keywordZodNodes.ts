export const keywordZodNodes = {
  any: 'z.any',
  number: 'z.number',
  integer: 'z.number',
  object: 'z.object',
  string: 'z.string',
  boolean: 'z.boolean',
  undefined: 'z.undefined',
  null: '.nullable',
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
  matches: '.regex',
} as const
