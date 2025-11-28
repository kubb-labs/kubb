import type { Address } from "./Address.ts";

export const chequeDetailsResponseTypeEnum = {
    "CHEQUE": "CHEQUE"
} as const;

export type ChequeDetailsResponseTypeEnumKey = (typeof chequeDetailsResponseTypeEnum)[keyof typeof chequeDetailsResponseTypeEnum];

export type ChequeDetailsResponse = {
    type: ChequeDetailsResponseTypeEnumKey;
    /**
     * @description Payment Instrument ID that can be passed to the /transfers endpoint to trigger a transfer.\nThe type of the payment instrument dictates the method.\n
     * @type string
    */
    payment_instrument_id: string;
    /**
     * @description Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).
     * @type object
    */
    mailing_address: Address;
    /**
     * @type string
    */
    recipient_name: string;
};