import { renderTemplate } from './renderTemplate.js'

describe('renderTemplate', () => {
  test('template rendering', async () => {
    expect(renderTemplate('{{name}}', { name: 'pet' })).toBe('pet')
    expect(renderTemplate('{{name}}Service', { name: 'pet' })).toBe('petService')
    expect(renderTemplate('{{name}}Service')).toBe('Service')
    expect(renderTemplate('{{name}}Service', {})).toBe('Service')
    expect(renderTemplate('Service')).toBe('Service')
  })
})
