export type Cat = {
    /**
     * @minLength 1
     * @type string
    */
    readonly type: string;
    /**
     * @type string | undefined
    */
    name?: string;
    /**
     * @type boolean
    */
    indoor: boolean;
};