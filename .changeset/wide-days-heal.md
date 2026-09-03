---
'@kubb/adapter-oas': minor
---

Let `dateType` set `date-time`, `date`, and `time` independently, instead of one value driving all three

Pass an object to represent timestamps as a JS `Date` while keeping date-only and time-only fields as strings, since `Date` cannot round-trip those without inventing a timezone.

```ts
adapterOas({
  dateType: {
    dateTime: 'date',
    date: 'string',
    time: 'string',
  },
})
```

The scalar form (`dateType: 'date'`) still applies one value to all three formats.
