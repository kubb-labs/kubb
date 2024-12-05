export const addressIdentifierEnum = {
    "NW": "NW",
    "NE": "NE",
    "SW": "SW",
    "SE": "SE"
} as const;

 export type AddressIdentifierEnum = (typeof addressIdentifierEnum)[keyof typeof addressIdentifierEnum];

 export type Address = {
    /**
     * @type string | undefined
    */
    street?: string;
    /**
     * @type string | undefined
    */
    city?: string;
    /**
     * @type string | undefined
    */
    state?: string;
    /**
     * @type string | undefined
    */
    zip?: string;
    /**
     * @type array | undefined
    */
    identifier?: [
        number,
        string,
        AddressIdentifierEnum
    ];
};