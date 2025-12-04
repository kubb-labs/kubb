export const brexCashAccountDetailsResponseTypeEnum = {
  BREX_CASH: 'BREX_CASH',
} as const

export type BrexCashAccountDetailsResponseTypeEnumKey = (typeof brexCashAccountDetailsResponseTypeEnum)[keyof typeof brexCashAccountDetailsResponseTypeEnum]

export type BrexCashAccountDetailsResponse = {
  type: BrexCashAccountDetailsResponseTypeEnumKey
  /**
   * @description \nID of the Brex Business account.\n
   * @type string
   */
  id: string
}
