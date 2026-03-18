export const enumNamesType = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type EnumNamesTypeKey = (typeof enumNamesType)[keyof typeof enumNamesType]
