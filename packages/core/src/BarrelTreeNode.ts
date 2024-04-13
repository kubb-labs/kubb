import dirTree from 'directory-tree'

import type { DirectoryTree, DirectoryTreeOptions } from 'directory-tree'
import { FileManager, type KubbFile } from './FileManager.ts'
import { TreeNode } from './utils/TreeNode.ts'

type BarrelData = { type: KubbFile.Mode; path: KubbFile.Path; name: string }

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class BarrelTreeNode extends TreeNode<BarrelData> {
  public static build(path: string, options: DirectoryTreeOptions = {}): TreeNode<BarrelData> | null {
    try {
      const exclude = Array.isArray(options.exclude) ? options.exclude : [options.exclude].filter(Boolean)
      const filteredTree = dirTree(path, {
        extensions: options.extensions,
        exclude: [/node_modules/, ...exclude],
      })

      if (!filteredTree) {
        return null
      }

      const treeNode = new TreeNode({
        name: filteredTree.name,
        path: filteredTree.path,
        type: FileManager.getMode(filteredTree.path),
      })

      const recurse = (node: typeof treeNode, item: DirectoryTree) => {
        const subNode = node.addChild({
          name: item.name,
          path: item.path,
          type: FileManager.getMode(item.path),
        })

        if (item.children?.length) {
          item.children?.forEach((child) => {
            recurse(subNode, child)
          })
        }
      }

      filteredTree.children?.forEach((child) => recurse(treeNode, child))

      return treeNode
    } catch (e) {
      throw new Error('Something went wrong with creating index files with the TreehNode class', { cause: e })
    }
  }
}
