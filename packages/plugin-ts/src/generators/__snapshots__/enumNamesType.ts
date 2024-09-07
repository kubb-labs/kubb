export const enumNamesType = {
  Pending: 0,
  Received: 1,
} as const

export type EnumNamesType = (typeof enumNamesType)[keyof typeof enumNamesType]

export type enumNamesType = EnumNamesType
