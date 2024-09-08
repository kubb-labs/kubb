export const EnumNamesTypeEnum2 = {
  Pending: 0,
  Received: 1,
} as const

type EnumNamesTypeEnum2 = (typeof EnumNamesTypeEnum2)[keyof typeof EnumNamesTypeEnum2]

export type enumNamesType = EnumNamesTypeEnum2
