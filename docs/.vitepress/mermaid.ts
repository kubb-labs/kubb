import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import { run } from "@mermaid-js/mermaid-cli"

import type { Plugin } from 'vite';

async function getFilesInDirectory(directory: URL): Promise<string[]> {
  return (await readdir(directory)).filter(file => file[0] !== '.');
}

const graphsDirectory = new URL('graphs/', import.meta.url);

const mermaidRegExp = /^```mermaid\n([\S\s]*?)\n```/gm;
const greaterThanRegExp = /&gt;/g;
const svgIdRegExp = /my-svg/g;
const styleTagRegExp = /<style>[\S\s]*?<\/style>/gm;

export function renderMermaidGraphsPlugin(): Plugin {
  const existingGraphFileNamesPromise = mkdir(graphsDirectory, { recursive: true })
    .then(() => getFilesInDirectory(graphsDirectory))
    .then(files => new Set(files.filter(name => name.endsWith('.svg'))));
  const existingGraphsByName = new Map<string, Promise<string>>();

  async function renderGraph(codeBlock: string, outFile: string, hash: string) {
    const existingGraphFileNames = await existingGraphFileNamesPromise;
    const outFileURL = new URL(outFile, graphsDirectory);
    if (!existingGraphFileNames.has(outFile)) {
      console.warn(
        `Pre-rendered file ${outFile} not found, rendering...\nIf this throws on Vercel, you need to run "npm run build:docs" locally first and commit the updated svg files.`
      );
      const inFileURL = new URL(`${outFile}.mmd`, graphsDirectory);
      await writeFile(inFileURL, codeBlock);

      await run(
        fileURLToPath(
          inFileURL
        ), fileURLToPath(outFileURL),{
          parseMMDOptions: {
            mermaidConfig: {
              theme: "dark",
              fontSize: 13,
              flowchart: {
                padding: 4,
                useMaxWidth: true,
              },
              "themeCSS": "* { line-height: 1.5; } span.edgeLabel { padding: 2px 5px; }"
            }
          },
          puppeteerConfig: {
            "args": ["--no-sandbox"]
          }
        }
      )
    }
    const outFileContent = await readFile(outFileURL, 'utf8');
    // Styles need to be placed top-level, so we extract them and then
    // prepend them, separated with a line-break
    const extractedStyles: string[] = [];
    let hasReplacedId = false;
    const replacementId = `mermaid-${hash}`;
    const baseGraph = outFileContent
      // We need to replace some HTML entities
      .replace(greaterThanRegExp, '>')
      // First, we replace the default id with a unique, hash-based one
      .replace(svgIdRegExp, () => {
        hasReplacedId = true;
        return replacementId;
      })
      .replace(styleTagRegExp, styleTag => {
        extractedStyles.push(styleTag);
        return '';
      });
    if (!hasReplacedId) {
      throw new Error('Could not find expected id "my-svg"');
    }
    console.log('Extracted styles from mermaid chart:', extractedStyles.length);
    return `${extractedStyles.join('')}\n${baseGraph}`;
  }

  return {
    enforce: 'pre',
    name: 'render-mermaid-charts',
    async transform(code, id) {
      if (id.endsWith('.md')) {
        const renderedGraphs: string[] = [];
        const mermaidCodeBlocks: string[] = [];
        let match: RegExpExecArray | null = null;
        while ((match = mermaidRegExp.exec(code)) !== null) {
          mermaidCodeBlocks.push(match[1]);
        }
        await Promise.all(
          mermaidCodeBlocks.map(async (codeBlock, index) => {
            const hash = createHash('sha256').update(codeBlock).digest('hex').slice(0, 8);
            const outFile = `mermaid-${hash}.svg`;
            if (!existingGraphsByName.has(outFile)) {
              existingGraphsByName.set(outFile, renderGraph(codeBlock, outFile, hash));
            }
            renderedGraphs[index] = await existingGraphsByName.get(outFile)!;
          })
        );
        return code.replace(mermaidRegExp, () => renderedGraphs.shift()!);
      }
    }
  };
}
