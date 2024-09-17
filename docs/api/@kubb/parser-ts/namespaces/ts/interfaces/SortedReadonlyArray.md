[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / SortedReadonlyArray

# SortedReadonlyArray\<T\>

## Extends

- `ReadonlyArray`\<`T`\>

## Type Parameters

• **T**

## Properties

###  \_\_sortedArrayBrand

```ts
 __sortedArrayBrand: any;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3610

***

### \[unscopables\]

```ts
readonly [unscopables]: object;
```

Is an object whose properties have the value 'true'
when they will be absent when used in a 'with' statement.

#### \[unscopables\]?

```ts
readonly optional [unscopables]: boolean;
```

Is an object whose properties have the value 'true'
when they will be absent when used in a 'with' statement.

#### length?

```ts
readonly optional length: boolean;
```

Gets the length of the array. This is a number one higher than the highest element defined in an array.

#### \[iterator\]?

```ts
optional [iterator];
```

#### at?

```ts
optional at;
```

#### concat?

```ts
optional concat;
```

#### entries?

```ts
optional entries;
```

#### every?

```ts
optional every;
```

#### filter?

```ts
optional filter;
```

#### find?

```ts
optional find;
```

#### findIndex?

```ts
optional findIndex;
```

#### findLast?

```ts
optional findLast;
```

#### findLastIndex?

```ts
optional findLastIndex;
```

#### flat?

```ts
optional flat;
```

#### flatMap?

```ts
optional flatMap;
```

#### forEach?

```ts
optional forEach;
```

#### includes?

```ts
optional includes;
```

#### indexOf?

```ts
optional indexOf;
```

#### join?

```ts
optional join;
```

#### keys?

```ts
optional keys;
```

#### lastIndexOf?

```ts
optional lastIndexOf;
```

#### map?

```ts
optional map;
```

#### reduce?

```ts
optional reduce;
```

#### reduceRight?

```ts
optional reduceRight;
```

#### slice?

```ts
optional slice;
```

#### some?

```ts
optional some;
```

#### toLocaleString?

```ts
optional toLocaleString;
```

#### toReversed?

```ts
optional toReversed;
```

#### toSorted?

```ts
optional toSorted;
```

#### toSpliced?

```ts
optional toSpliced;
```

#### toString?

```ts
optional toString;
```

#### values?

```ts
optional values;
```

#### with?

```ts
optional with;
```

#### Inherited from

`ReadonlyArray.[unscopables]`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts:107

***

### length

```ts
readonly length: number;
```

Gets the length of the array. This is a number one higher than the highest element defined in an array.

#### Inherited from

`ReadonlyArray.length`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1192

## Methods

### \[iterator\]()

```ts
iterator: ArrayIterator<T>
```

Iterator of values in the array.

#### Returns

`ArrayIterator`\<`T`\>

#### Inherited from

`ReadonlyArray.[iterator]`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2015.iterable.d.ts:114

***

### at()

```ts
at(index): undefined | T
```

Returns the item located at the specified index.

#### Parameters

• **index**: `number`

The zero-based index of the desired code unit. A negative index will count back from the last item.

#### Returns

`undefined` \| `T`

#### Inherited from

`ReadonlyArray.at`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2022.array.d.ts:32

***

### concat()

#### concat(items)

```ts
concat(...items): T[]
```

Combines two or more arrays.

##### Parameters

• ...**items**: `ConcatArray`\<`T`\>[]

Additional items to add to the end of array1.

##### Returns

`T`[]

##### Inherited from

`ReadonlyArray.concat`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1205

#### concat(items)

```ts
concat(...items): T[]
```

Combines two or more arrays.

##### Parameters

• ...**items**: (`T` \| `ConcatArray`\<`T`\>)[]

Additional items to add to the end of array1.

##### Returns

`T`[]

##### Inherited from

`ReadonlyArray.concat`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1210

***

### entries()

```ts
entries(): ArrayIterator<[number, T]>
```

Returns an iterable of key, value pairs for every entry in the array

#### Returns

`ArrayIterator`\<[`number`, `T`]\>

#### Inherited from

`ReadonlyArray.entries`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2015.iterable.d.ts:119

***

### every()

#### every(predicate, thisArg)

```ts
every<S>(predicate, thisArg?): this is readonly S[]
```

Determines whether all the members of an array satisfy the specified test.

##### Type Parameters

• **S**

##### Parameters

• **predicate**

A function that accepts up to three arguments. The every method calls
the predicate function for each element in the array until the predicate returns a value
which is coercible to the Boolean value false, or until the end of the array.

• **thisArg?**: `any`

An object to which the this keyword can refer in the predicate function.
If thisArg is omitted, undefined is used as the this value.

##### Returns

`this is readonly S[]`

##### Inherited from

`ReadonlyArray.every`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1242

#### every(predicate, thisArg)

```ts
every(predicate, thisArg?): boolean
```

Determines whether all the members of an array satisfy the specified test.

##### Parameters

• **predicate**

A function that accepts up to three arguments. The every method calls
the predicate function for each element in the array until the predicate returns a value
which is coercible to the Boolean value false, or until the end of the array.

• **thisArg?**: `any`

An object to which the this keyword can refer in the predicate function.
If thisArg is omitted, undefined is used as the this value.

##### Returns

`boolean`

##### Inherited from

`ReadonlyArray.every`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1251

***

### filter()

#### filter(predicate, thisArg)

```ts
filter<S>(predicate, thisArg?): S[]
```

Returns the elements of an array that meet the condition specified in a callback function.

##### Type Parameters

• **S**

##### Parameters

• **predicate**

A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.

• **thisArg?**: `any`

An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.

##### Returns

`S`[]

##### Inherited from

`ReadonlyArray.filter`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1278

#### filter(predicate, thisArg)

```ts
filter(predicate, thisArg?): T[]
```

Returns the elements of an array that meet the condition specified in a callback function.

##### Parameters

• **predicate**

A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.

• **thisArg?**: `any`

An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.

##### Returns

`T`[]

##### Inherited from

`ReadonlyArray.filter`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1284

#### filter(predicate, thisArg)

```ts
filter(predicate, thisArg?): NonFalsy<T>[]
```

##### Parameters

• **predicate**: `BooleanConstructor`

• **thisArg?**: `any`

##### Returns

`NonFalsy`\<`T`\>[]

##### Inherited from

`ReadonlyArray.filter`

##### Defined in

[packages/config-ts/reset.d.ts:23](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/config-ts/reset.d.ts#L23)

***

### find()

#### find(predicate, thisArg)

```ts
find<S>(predicate, thisArg?): undefined | S
```

Returns the value of the first element in the array where predicate is true, and undefined
otherwise.

##### Type Parameters

• **S**

##### Parameters

• **predicate**

find calls predicate once for each element of the array, in ascending
order, until it finds one where predicate returns true. If such an element is found, find
immediately returns that element value. Otherwise, find returns undefined.

• **thisArg?**: `any`

If provided, it will be used as the this value for each invocation of
predicate. If it is not provided, undefined is used instead.

##### Returns

`undefined` \| `S`

##### Inherited from

`ReadonlyArray.find`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2015.core.d.ts:352

#### find(predicate, thisArg)

```ts
find(predicate, thisArg?): undefined | T
```

##### Parameters

• **predicate**

• **thisArg?**: `any`

##### Returns

`undefined` \| `T`

##### Inherited from

`ReadonlyArray.find`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2015.core.d.ts:353

***

### findIndex()

```ts
findIndex(predicate, thisArg?): number
```

Returns the index of the first element in the array where predicate is true, and -1
otherwise.

#### Parameters

• **predicate**

find calls predicate once for each element of the array, in ascending
order, until it finds one where predicate returns true. If such an element is found,
findIndex immediately returns that element index. Otherwise, findIndex returns -1.

• **thisArg?**: `any`

If provided, it will be used as the this value for each invocation of
predicate. If it is not provided, undefined is used instead.

#### Returns

`number`

#### Inherited from

`ReadonlyArray.findIndex`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2015.core.d.ts:364

***

### findLast()

#### findLast(predicate, thisArg)

```ts
findLast<S>(predicate, thisArg?): undefined | S
```

Returns the value of the last element in the array where predicate is true, and undefined
otherwise.

##### Type Parameters

• **S**

##### Parameters

• **predicate**

findLast calls predicate once for each element of the array, in descending
order, until it finds one where predicate returns true. If such an element is found, findLast
immediately returns that element value. Otherwise, findLast returns undefined.

• **thisArg?**: `any`

If provided, it will be used as the this value for each invocation of
predicate. If it is not provided, undefined is used instead.

##### Returns

`undefined` \| `S`

##### Inherited from

`ReadonlyArray.findLast`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2023.array.d.ts:98

#### findLast(predicate, thisArg)

```ts
findLast(predicate, thisArg?): undefined | T
```

##### Parameters

• **predicate**

• **thisArg?**: `any`

##### Returns

`undefined` \| `T`

##### Inherited from

`ReadonlyArray.findLast`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2023.array.d.ts:102

***

### findLastIndex()

```ts
findLastIndex(predicate, thisArg?): number
```

Returns the index of the last element in the array where predicate is true, and -1
otherwise.

#### Parameters

• **predicate**

findLastIndex calls predicate once for each element of the array, in descending
order, until it finds one where predicate returns true. If such an element is found,
findLastIndex immediately returns that element index. Otherwise, findLastIndex returns -1.

• **thisArg?**: `any`

If provided, it will be used as the this value for each invocation of
predicate. If it is not provided, undefined is used instead.

#### Returns

`number`

#### Inherited from

`ReadonlyArray.findLastIndex`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2023.array.d.ts:116

***

### flat()

```ts
flat<A, D>(this, depth?): FlatArray<A, D>[]
```

Returns a new array with all sub-array elements concatenated into it recursively up to the
specified depth.

#### Type Parameters

• **A**

• **D** *extends* `number` = `1`

#### Parameters

• **this**: `A`

• **depth?**: `D`

The maximum recursion depth

#### Returns

`FlatArray`\<`A`, `D`\>[]

#### Inherited from

`ReadonlyArray.flat`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2019.array.d.ts:47

***

### flatMap()

```ts
flatMap<U, This>(callback, thisArg?): U[]
```

Calls a defined callback function on each element of an array. Then, flattens the result into
a new array.
This is identical to a map followed by flat with depth 1.

#### Type Parameters

• **U**

• **This** = `undefined`

#### Parameters

• **callback**

A function that accepts up to three arguments. The flatMap method calls the
callback function one time for each element in the array.

• **thisArg?**: `This`

An object to which the this keyword can refer in the callback function. If
thisArg is omitted, undefined is used as the this value.

#### Returns

`U`[]

#### Inherited from

`ReadonlyArray.flatMap`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2019.array.d.ts:36

***

### forEach()

```ts
forEach(callbackfn, thisArg?): void
```

Performs the specified action for each element in an array.

#### Parameters

• **callbackfn**

A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.

• **thisArg?**: `any`

An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.

#### Returns

`void`

#### Inherited from

`ReadonlyArray.forEach`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1266

***

### includes()

```ts
includes(searchElement, fromIndex?): boolean
```

Determines whether an array includes a certain element, returning true or false as appropriate.

#### Parameters

• **searchElement**: `T`

The element to search for.

• **fromIndex?**: `number`

The position in this array at which to begin searching for searchElement.

#### Returns

`boolean`

#### Inherited from

`ReadonlyArray.includes`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2016.array.include.d.ts:34

***

### indexOf()

```ts
indexOf(searchElement, fromIndex?): number
```

Returns the index of the first occurrence of a value in an array.

#### Parameters

• **searchElement**: `T`

The value to locate in the array.

• **fromIndex?**: `number`

The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.

#### Returns

`number`

#### Inherited from

`ReadonlyArray.indexOf`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1227

***

### join()

```ts
join(separator?): string
```

Adds all the elements of an array separated by the specified separator string.

#### Parameters

• **separator?**: `string`

A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.

#### Returns

`string`

#### Inherited from

`ReadonlyArray.join`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1215

***

### keys()

```ts
keys(): ArrayIterator<number>
```

Returns an iterable of keys in the array

#### Returns

`ArrayIterator`\<`number`\>

#### Inherited from

`ReadonlyArray.keys`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2015.iterable.d.ts:124

***

### lastIndexOf()

```ts
lastIndexOf(searchElement, fromIndex?): number
```

Returns the index of the last occurrence of a specified value in an array.

#### Parameters

• **searchElement**: `T`

The value to locate in the array.

• **fromIndex?**: `number`

The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.

#### Returns

`number`

#### Inherited from

`ReadonlyArray.lastIndexOf`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1233

***

### map()

```ts
map<U>(callbackfn, thisArg?): U[]
```

Calls a defined callback function on each element of an array, and returns an array that contains the results.

#### Type Parameters

• **U**

#### Parameters

• **callbackfn**

A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.

• **thisArg?**: `any`

An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.

#### Returns

`U`[]

#### Inherited from

`ReadonlyArray.map`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1272

***

### reduce()

#### reduce(callbackfn)

```ts
reduce(callbackfn): T
```

Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

##### Parameters

• **callbackfn**

A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.

##### Returns

`T`

##### Inherited from

`ReadonlyArray.reduce`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1290

#### reduce(callbackfn, initialValue)

```ts
reduce(callbackfn, initialValue): T
```

##### Parameters

• **callbackfn**

• **initialValue**: `T`

##### Returns

`T`

##### Inherited from

`ReadonlyArray.reduce`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1291

#### reduce(callbackfn, initialValue)

```ts
reduce<U>(callbackfn, initialValue): U
```

Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

##### Type Parameters

• **U**

##### Parameters

• **callbackfn**

A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.

• **initialValue**: `U`

If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.

##### Returns

`U`

##### Inherited from

`ReadonlyArray.reduce`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1297

***

### reduceRight()

#### reduceRight(callbackfn)

```ts
reduceRight(callbackfn): T
```

Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

##### Parameters

• **callbackfn**

A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.

##### Returns

`T`

##### Inherited from

`ReadonlyArray.reduceRight`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1303

#### reduceRight(callbackfn, initialValue)

```ts
reduceRight(callbackfn, initialValue): T
```

##### Parameters

• **callbackfn**

• **initialValue**: `T`

##### Returns

`T`

##### Inherited from

`ReadonlyArray.reduceRight`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1304

#### reduceRight(callbackfn, initialValue)

```ts
reduceRight<U>(callbackfn, initialValue): U
```

Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

##### Type Parameters

• **U**

##### Parameters

• **callbackfn**

A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.

• **initialValue**: `U`

If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.

##### Returns

`U`

##### Inherited from

`ReadonlyArray.reduceRight`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1310

***

### slice()

```ts
slice(start?, end?): T[]
```

Returns a section of an array.

#### Parameters

• **start?**: `number`

The beginning of the specified portion of the array.

• **end?**: `number`

The end of the specified portion of the array. This is exclusive of the element at the index 'end'.

#### Returns

`T`[]

#### Inherited from

`ReadonlyArray.slice`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1221

***

### some()

```ts
some(predicate, thisArg?): boolean
```

Determines whether the specified callback function returns true for any element of an array.

#### Parameters

• **predicate**

A function that accepts up to three arguments. The some method calls
the predicate function for each element in the array until the predicate returns a value
which is coercible to the Boolean value true, or until the end of the array.

• **thisArg?**: `any`

An object to which the this keyword can refer in the predicate function.
If thisArg is omitted, undefined is used as the this value.

#### Returns

`boolean`

#### Inherited from

`ReadonlyArray.some`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1260

***

### toLocaleString()

#### toLocaleString(undefined)

```ts
toLocaleString(): string
```

Returns a string representation of an array. The elements are converted to string using their toLocaleString methods.

##### Returns

`string`

##### Inherited from

`ReadonlyArray.toLocaleString`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1200

#### toLocaleString(locales, options)

```ts
toLocaleString(locales, options?): string
```

##### Parameters

• **locales**: `string` \| `string`[]

• **options?**: `NumberFormatOptions` & `DateTimeFormatOptions`

##### Returns

`string`

##### Inherited from

`ReadonlyArray.toLocaleString`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2015.core.d.ts:366

***

### toReversed()

```ts
toReversed(): T[]
```

Copies the array and returns the copied array with all of its elements reversed.

#### Returns

`T`[]

#### Inherited from

`ReadonlyArray.toReversed`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2023.array.d.ts:124

***

### toSorted()

```ts
toSorted(compareFn?): T[]
```

Copies and sorts the array.

#### Parameters

• **compareFn?**

Function used to determine the order of the elements. It is expected to return
a negative value if the first argument is less than the second argument, zero if they're equal, and a positive
value otherwise. If omitted, the elements are sorted in ascending, ASCII character order.
```ts
[11, 2, 22, 1].toSorted((a, b) => a - b) // [1, 2, 11, 22]
```

#### Returns

`T`[]

#### Inherited from

`ReadonlyArray.toSorted`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2023.array.d.ts:135

***

### toSpliced()

#### toSpliced(start, deleteCount, items)

```ts
toSpliced(
   start, 
   deleteCount, ...
   items): T[]
```

Copies an array and removes elements while, if necessary, inserting new elements in their place, returning the remaining elements.

##### Parameters

• **start**: `number`

The zero-based location in the array from which to start removing elements.

• **deleteCount**: `number`

The number of elements to remove.

• ...**items**: `T`[]

Elements to insert into the copied array in place of the deleted elements.

##### Returns

`T`[]

A copy of the original array with the remaining elements.

##### Inherited from

`ReadonlyArray.toSpliced`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2023.array.d.ts:144

#### toSpliced(start, deleteCount)

```ts
toSpliced(start, deleteCount?): T[]
```

Copies an array and removes elements while returning the remaining elements.

##### Parameters

• **start**: `number`

The zero-based location in the array from which to start removing elements.

• **deleteCount?**: `number`

The number of elements to remove.

##### Returns

`T`[]

A copy of the original array with the remaining elements.

##### Inherited from

`ReadonlyArray.toSpliced`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2023.array.d.ts:152

***

### toString()

```ts
toString(): string
```

Returns a string representation of an array.

#### Returns

`string`

#### Inherited from

`ReadonlyArray.toString`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es5.d.ts:1196

***

### values()

```ts
values(): ArrayIterator<T>
```

Returns an iterable of values in the array

#### Returns

`ArrayIterator`\<`T`\>

#### Inherited from

`ReadonlyArray.values`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2015.iterable.d.ts:129

***

### with()

```ts
with(index, value): T[]
```

Copies an array, then overwrites the value at the provided index with the
given value. If the index is negative, then it replaces from the end
of the array

#### Parameters

• **index**: `number`

The index of the value to overwrite. If the index is
negative, then it replaces from the end of the array.

• **value**: `T`

The value to insert into the copied array.

#### Returns

`T`[]

A copy of the original array with the inserted value.

#### Inherited from

`ReadonlyArray.with`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/lib.es2023.array.d.ts:163
