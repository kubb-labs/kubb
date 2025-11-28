export const counterPartyIncomingTransferTypeEnum = {
    "BANK": "BANK"
} as const;

export type CounterPartyIncomingTransferTypeEnumKey = (typeof counterPartyIncomingTransferTypeEnum)[keyof typeof counterPartyIncomingTransferTypeEnum];

export type CounterPartyIncomingTransferType = CounterPartyIncomingTransferTypeEnumKey;