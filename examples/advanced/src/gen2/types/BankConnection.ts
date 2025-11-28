import type { Balance } from "./Balance.ts";
import type { BankDetails } from "./BankDetails.ts";

export type BankConnection = {
    /**
     * @type string
    */
    id: string;
    bank_details: (BankDetails & any);
    /**
     * @description \nBrex business account ID\n
     * @type string
    */
    brex_account_id?: string | null;
    /**
     * @type string
    */
    last_four: string;
    available_balance?: Balance | null;
    current_balance?: Balance | null;
};