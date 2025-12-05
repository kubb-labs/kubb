export const bookTransferDetailsResponseTypeEnum = {
  BOOK_TRANSFER: 'BOOK_TRANSFER',
} as const

export type BookTransferDetailsResponseTypeEnumKey = (typeof bookTransferDetailsResponseTypeEnum)[keyof typeof bookTransferDetailsResponseTypeEnum]

export type BookTransferDetailsResponse = {
  type: BookTransferDetailsResponseTypeEnumKey
  /**
   * @description This feature is currently limited to certain customers, please reach out if you are interested
   * @type string
   */
  deposit_account_id: string
}
