export const paymentTypeEnum = {
  ACH: 'ACH',
  DOMESTIC_WIRE: 'DOMESTIC_WIRE',
  CHEQUE: 'CHEQUE',
  INTERNATIONAL_WIRE: 'INTERNATIONAL_WIRE',
  BOOK_TRANSFER: 'BOOK_TRANSFER',
} as const

export type PaymentTypeEnumKey = (typeof paymentTypeEnum)[keyof typeof paymentTypeEnum]

export type PaymentType = PaymentTypeEnumKey
