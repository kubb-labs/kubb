export const enumVarNamesTypeEnum2 = {
  Pending: 0,
  Received: 1,
} as const

export type EnumVarNamesType = (typeof enumVarNamesTypeEnum2)[keyof typeof enumVarNamesTypeEnum2]

export type enumVarNamesType = EnumVarNamesType
