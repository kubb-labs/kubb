export const EnumNamesType = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type EnumNamesTypeKey = (typeof EnumNamesType)[keyof typeof EnumNamesType]
