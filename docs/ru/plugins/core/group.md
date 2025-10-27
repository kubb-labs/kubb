Группировка позволяет объединять файлы в папку на основе определенного `type`.

Представьте, что у вас есть следующая настройка:

```typescript
group: {
  type: 'tag',
  name({ group }){
    return `${group}Controller`
  }
}
```
Это создаст структуру следующего вида:
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
