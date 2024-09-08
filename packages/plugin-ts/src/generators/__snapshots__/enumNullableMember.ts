export const enumNullableMemberEnum2 = {
  first: 'first',
  second: 'second',
} as const

export type EnumNullableMemberEnum2 = (typeof enumNullableMemberEnum2)[keyof typeof enumNullableMemberEnum2]

export type enumNullableMember = EnumNullableMemberEnum2 | null
