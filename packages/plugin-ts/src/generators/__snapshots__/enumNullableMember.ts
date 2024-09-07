export const enumNullableMemberEnum2 = {
  first: 'first',
  second: 'second',
} as const

export type EnumNullableMember = (typeof enumNullableMemberEnum2)[keyof typeof enumNullableMemberEnum2]

export type enumNullableMember = EnumNullableMember | null
