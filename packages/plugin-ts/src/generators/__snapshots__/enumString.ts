export const enumStringEnum2 = {
    "created_at": "created_at",
    "description": "description",
    "FILE.UPLOADED": "FILE.UPLOADED",
    "FILE.DOWNLOADED": "FILE.DOWNLOADED"
} as const;

 export type EnumStringEnum2 = (typeof enumStringEnum2)[keyof typeof enumStringEnum2];

 export type enumString = EnumStringEnum2;
