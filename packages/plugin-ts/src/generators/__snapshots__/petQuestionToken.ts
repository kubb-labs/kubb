
 export type pet = {
    /**
     * @type integer, int64
    */
    id: number;
    /**
     * @type string
    */
    name: string;
    /**
     * @type string | undefined
    */
    tag?: string;
    /**
     * @type object | undefined
    */
    category?: category;
};
