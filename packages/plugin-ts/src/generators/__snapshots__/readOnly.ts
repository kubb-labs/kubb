
 export type demo = {
    /**
     * @type integer | undefined
    */
    readonly attribute_readonly?: number;
    /**
     * @description not required
     * @type integer | undefined
    */
    attribute_writeOnly?: number;
    /**
     * @type integer | undefined
    */
    readonly attribute_with_ref?: attributeReadonly;
    /**
     * @type integer | undefined
    */
    attribute_with_ref_readonly?: attributeWriteOnly;
};
