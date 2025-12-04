export const brexCashDetailsTypeEnum = {
  BREX_CASH: 'BREX_CASH',
} as const

export type BrexCashDetailsTypeEnumKey = (typeof brexCashDetailsTypeEnum)[keyof typeof brexCashDetailsTypeEnum]

export type BrexCashDetails = {
  type: BrexCashDetailsTypeEnumKey
  /**
   * @description \nID of the Brex business account: Can be found from the [List business accounts](/openapi/transactions_api/#operation/listAccounts) endpoint\n
   * @type string
   */
  id: string
}
