export const enumItemsEnum2 = {
  created_at: 'created_at',
  description: 'description',
} as const

export type EnumItemsEnum2 = (typeof enumItemsEnum2)[keyof typeof enumItemsEnum2]

export type enumItems = EnumItemsEnum2[]
