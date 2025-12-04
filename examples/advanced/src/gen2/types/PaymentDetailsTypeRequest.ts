export const paymentDetailsTypeRequestEnum = {
  ACH: 'ACH',
  DOMESTIC_WIRE: 'DOMESTIC_WIRE',
  CHEQUE: 'CHEQUE',
} as const

export type PaymentDetailsTypeRequestEnumKey = (typeof paymentDetailsTypeRequestEnum)[keyof typeof paymentDetailsTypeRequestEnum]

export type PaymentDetailsTypeRequest = PaymentDetailsTypeRequestEnumKey
