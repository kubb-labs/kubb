Grouping combines files in a folder based on a specific `type`.

For example, with this configuration:

```typescript [kubb.config.ts]
group: {
  type: 'tag',
  name({ group }){
    return `${group}Controller`
  }
}
```

This generates the following structure:
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
