export const enumStringEnum2 = {
  created_at: 'created_at',
  description: 'description',
  'FILE.UPLOADED': 'FILE.UPLOADED',
  'FILE.DOWNLOADED': 'FILE.DOWNLOADED',
} as const

export type EnumString = (typeof enumStringEnum2)[keyof typeof enumStringEnum2]

export type enumString = EnumString
