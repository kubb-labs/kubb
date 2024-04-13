const getCircularReplacer = () => {
  const seen = new WeakSet()
  return (_key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return
      }
      seen.add(value)
    }
    return value
  }
}

export class TreeNode<T = unknown> {
  data: T

  parent?: TreeNode<T>
  current?: T

  children: Array<TreeNode<T>> = []

  constructor(data: T, parent?: TreeNode<T>) {
    this.data = data
    this.parent = parent
    return this
  }

  addChild(data: T): TreeNode<T> {
    const child = new TreeNode(data, this)
    if (!this.children) {
      this.children = []
    }
    this.children.push(child)
    return child
  }

  find(data?: T): TreeNode<T> | null {
    if (!data) {
      return null
    }

    if (data === this.data) {
      return this
    }

    if (this.children?.length) {
      for (let i = 0, { length } = this.children, target: TreeNode<T> | null = null; i < length; i++) {
        target = this.children[i]!.find(data)
        if (target) {
          return target
        }
      }
    }

    return null
  }

  get leaves(): TreeNode<T>[] {
    if (!this.children || this.children.length === 0) {
      // this is a leaf
      return [this]
    }

    // if not a leaf, return all children's leaves recursively
    const leaves: TreeNode<T>[] = []
    if (this.children) {
      for (let i = 0, { length } = this.children; i < length; i++) {
        leaves.push.apply(leaves, this.children[i]!.leaves)
      }
    }
    return leaves
  }

  get root(): TreeNode<T> {
    if (!this.parent) {
      return this
    }
    return this.parent.root
  }

  map(callback: (value: TreeNode<T>, previousValue: TreeNode<T> | undefined, nextValue: TreeNode<T> | undefined) => void): this {
    if (typeof callback !== 'function') {
      throw new TypeError('forEach() callback must be a function')
    }

    // run this node through function
    callback(this, undefined, undefined)

    // do the same for all children
    if (this.children) {
      for (let i = 0, { length } = this.children; i < length; i++) {
        this.children[i]?.forEach((item) => {
          callback(item, this.children[i - 1], this.children[i + 1])
        })
      }
    }

    return this
  }

  forEach(callback: (value: TreeNode<T>, index: number) => void): this {
    if (typeof callback !== 'function') {
      throw new TypeError('forEach() callback must be a function')
    }

    // run this node through function
    callback(this, 0)

    // do the same for all children
    if (this.children) {
      for (let i = 0, { length } = this.children; i < length; i++) {
        this.children[i]?.forEach((item) => {
          callback(item, i)
        })
      }
    }

    return this
  }
  toString() {
    return JSON.stringify(this, getCircularReplacer(), 2)
  }
}
