export const brexCashAccountDetailsTypeEnum = {
    "BREX_CASH": "BREX_CASH"
} as const;

export type BrexCashAccountDetailsTypeEnumKey = (typeof brexCashAccountDetailsTypeEnum)[keyof typeof brexCashAccountDetailsTypeEnum];

export type BrexCashAccountDetails = {
    type: BrexCashAccountDetailsTypeEnumKey;
    /**
     * @description \nID of the Brex Business account: Can be found from the `/accounts` endpoint\nwhere instrument type is `CASH`.\n
     * @type string
    */
    id: string;
};