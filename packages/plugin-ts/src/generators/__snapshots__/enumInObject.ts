export const enumInObjectReasonEnum2 = {
  created_at: 'created_at',
  description: 'description',
} as const

export type EnumInObjectReasonEnum2 = (typeof enumInObjectReasonEnum2)[keyof typeof enumInObjectReasonEnum2]

export type enumInObject = {
  /**
   * @type string | undefined
   */
  reason?: EnumInObjectReasonEnum2
}
