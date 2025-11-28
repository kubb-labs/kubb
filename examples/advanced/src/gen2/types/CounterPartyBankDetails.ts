export const counterPartyBankDetailsTypeEnum = {
    "BANK": "BANK"
} as const;

export type CounterPartyBankDetailsTypeEnumKey = (typeof counterPartyBankDetailsTypeEnum)[keyof typeof counterPartyBankDetailsTypeEnum];

export type CounterPartyBankDetails = {
    type: CounterPartyBankDetailsTypeEnumKey;
    /**
     * @description \nThe financial account id: Can be found from the [List linked accounts](/openapi/payments_api/#operation/listLinkedAccounts) endpoint\n
     * @type string
    */
    id: string;
};