export const paymentDetailsTypeResponseEnum = {
    "ACH": "ACH",
    "DOMESTIC_WIRE": "DOMESTIC_WIRE",
    "CHEQUE": "CHEQUE",
    "INTERNATIONAL_WIRE": "INTERNATIONAL_WIRE"
} as const;

export type PaymentDetailsTypeResponseEnumKey = (typeof paymentDetailsTypeResponseEnum)[keyof typeof paymentDetailsTypeResponseEnum];

export type PaymentDetailsTypeResponse = PaymentDetailsTypeResponseEnumKey;