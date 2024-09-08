export const enumAllOfReasonEnum2 = {
  created_at: 'created_at',
  description: 'description',
} as const

export type EnumAllOfReasonEnum2 = (typeof enumAllOfReasonEnum2)[keyof typeof enumAllOfReasonEnum2]

export type enumAllOf = {
  reason?: EnumAllOfReasonEnum2
}
