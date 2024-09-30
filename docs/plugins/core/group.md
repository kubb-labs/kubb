Grouping makes it possible to combine files in a folder based on specific `type`.

Imagine you have the following setup:

```typescript
group: {
  type: 'tag',
  name({ group }){
    return `${group}Controller`
  }
}
```
That will create a structure like this:
```
.
├── src/
│   └── petController/
│   │   ├── addPet.ts
│   │   └── getPet.ts
│   └── storeController/
│       ├── createStore.ts
│       └── getStoreById.ts
├── petStore.yaml
├── kubb.config.ts
└── package.json
```
