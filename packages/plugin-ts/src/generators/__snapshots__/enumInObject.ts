export const enumInObjectReasonEnum2 = {
  created_at: 'created_at',
  description: 'description',
} as const

export type EnumInObject = (typeof enumInObjectReasonEnum2)[keyof typeof enumInObjectReasonEnum2]

export type enumInObject = {
  /**
   * @type string | undefined
   */
  reason?: EnumInObject
}
