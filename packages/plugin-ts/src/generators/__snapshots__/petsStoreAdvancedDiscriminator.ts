
 export const advancedTypeEnum2 = {
    "enum": "enum",
    "range": "range",
    "regex": "regex",
    "slider": "slider"
} as const;

 export type AdvancedTypeEnum2 = (typeof advancedTypeEnum2)[keyof typeof advancedTypeEnum2];

 export type advanced = ((enumerationValueSpecificationDto & {
    /**
     * @type string
    */
    readonly type: AdvancedTypeEnum2;
}) | (rangeValueSpecificationDto & {
    /**
     * @type string
    */
    readonly type: AdvancedTypeEnum2;
}) | (regexValueSpecificationDto & {
    /**
     * @type string
    */
    readonly type: AdvancedTypeEnum2;
}) | (sliderValueSpecificationDto & {
    /**
     * @type string
    */
    readonly type: AdvancedTypeEnum2;
}));
