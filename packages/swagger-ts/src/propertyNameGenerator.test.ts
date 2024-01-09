import { generatePropertyName } from "./propertyNameGenerator";

describe('propertyNameGenerator', async () => {
    it('should return same value', () => {
        const value = 'demo-value';
        const returnVal = generatePropertyName(value);

        expect(returnVal).toBe(value);
    })

    it('should return camel cased value', () => {
        const value = 'demo-value';
        const returnVal = generatePropertyName(value, 'camelCase');

        expect(returnVal).toBe('demoValue');
    })

    it('should return pascal cased value', () => {
        const value = 'demo-value';
        const returnVal = generatePropertyName(value, 'PascalCase');

        expect(returnVal).toBe('DemoValue');
    })

    it('should return kebab cased value', () => {
        const value = 'demo_value';
        const returnVal = generatePropertyName(value, 'kebab-case');

        expect(returnVal).toBe('demo-value');
    })
})