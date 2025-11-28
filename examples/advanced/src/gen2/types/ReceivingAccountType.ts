export const receivingAccountTypeEnum = {
    "BREX_CASH": "BREX_CASH"
} as const;

export type ReceivingAccountTypeEnumKey = (typeof receivingAccountTypeEnum)[keyof typeof receivingAccountTypeEnum];

export type ReceivingAccountType = ReceivingAccountTypeEnumKey;