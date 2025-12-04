export const recipientTypeEnum = {
  ACCOUNT_ID: 'ACCOUNT_ID',
  PAYMENT_INSTRUMENT_ID: 'PAYMENT_INSTRUMENT_ID',
} as const

export type RecipientTypeEnumKey = (typeof recipientTypeEnum)[keyof typeof recipientTypeEnum]

/**
 * @description Specifies the type of the recipient. \n`ACCOUNT_ID` is the ID of a Brex Business account.\n`PAYMENT_INSTRUMENT_ID` is the ID of Payment Instrument of the receiving Brex account.\n
 */
export type RecipientType = RecipientTypeEnumKey
