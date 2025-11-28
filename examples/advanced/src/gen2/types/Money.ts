/**
 * @description \nMoney fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive). The amount of money will be represented in the smallest denomination\nof the currency indicated. For example, USD 7.00 will be represented in cents with an amount of 700.\n
*/
export type Money = {
    /**
     * @description The amount of money, in the smallest denomination of the currency indicated by currency. For example, when currency is USD, amount is in cents.
     * @type integer, int64
    */
    amount: number;
    /**
     * @description The type of currency, in ISO 4217 format.
     * @default "USD"
     * @type string
    */
    currency?: string | null;
};