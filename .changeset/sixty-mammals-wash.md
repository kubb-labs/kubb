---
"@kubb/plugin-cypress": patch
---

Align Cypress request function signatures with client plugin by adding configurable parameter handling options:

- `paramsCasing` to control casing style for parameter names
- `paramsType` to choose between inline or object parameter passing
- `pathParamsType` to configure how path parameters are passed

This aligns the Cypress plugin with the client plugin's parameter handling capabilities.
