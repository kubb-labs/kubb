export const enumNullableTypeEnum2 = {
  first: 'first',
  second: 'second',
} as const

export type EnumNullableType = (typeof enumNullableTypeEnum2)[keyof typeof enumNullableTypeEnum2]

export type enumNullableType = EnumNullableType | null
