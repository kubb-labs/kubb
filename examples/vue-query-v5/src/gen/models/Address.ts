export const addressIdentifier = {
    "NW": "NW",
    "NE": "NE",
    "SW": "SW",
    "SE": "SE"
} as const;
export type AddressIdentifier = (typeof addressIdentifier)[keyof typeof addressIdentifier];
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
    identifier?: [
        number,
        string,
        AddressIdentifier
    ];
};