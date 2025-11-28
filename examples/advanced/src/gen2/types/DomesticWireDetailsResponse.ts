import type { Address } from "./Address.ts";

export const domesticWireDetailsResponseTypeEnum = {
    "DOMESTIC_WIRE": "DOMESTIC_WIRE"
} as const;

export type DomesticWireDetailsResponseTypeEnumKey = (typeof domesticWireDetailsResponseTypeEnum)[keyof typeof domesticWireDetailsResponseTypeEnum];

export type DomesticWireDetailsResponse = {
    type: DomesticWireDetailsResponseTypeEnumKey;
    /**
     * @description Payment Instrument ID that can be passed to the /transfers endpoint to trigger a transfer.\nThe type of the payment instrument dictates the method.\n
     * @type string
    */
    payment_instrument_id: string;
    /**
     * @type string
    */
    routing_number: string;
    /**
     * @type string
    */
    account_number: string;
    /**
     * @description Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).
     * @type object
    */
    address: Address;
};