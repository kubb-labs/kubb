import type { BankType } from "./BankType.ts";

export type BankDetails = {
    /**
     * @description \nThe name of the bank\n
     * @type string
    */
    name: string;
    type: (BankType & any);
};