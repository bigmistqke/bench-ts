import ts from 'typescript'

type Accessor<T> = () => T

const tsModules: Record<string, { content: string; version: number }> = {}
function modifyImportPaths(code: string, alias?: Record<string, string>) {
  return code.replace(/import ([^"']+) from ["']([^"']+)["']/g, (match, varName, path) => {
    if (alias) {
      const entries = Object.entries(alias)
      for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i]
        if (path.startsWith(key)) {
          return `import ${varName} from "${value}"`
        }
      }
    }
    if (path.startsWith('blob:') || path.startsWith('http:') || path.startsWith('https:') || path.startsWith('.')) {
      return `import ${varName} from "${path}"`
    } else {
      return `import ${varName} from "https://esm.sh/${path}"`
    }
  })
}

export class TsNode {
  id: string
  path: Accessor<string>
  code: {
    js: string
    ts: string
  }
  private _module: any

  constructor({
    id,
    path,
    code,
    module,
  }: {
    id: string
    path: Accessor<string>
    code: {
      js: Accessor<string>
      ts: Accessor<string>
    }
    module: any
  }) {
    this.id = id
    this.path = path

    this.code = {
      get js() {
        return code.js()
      },
      get ts() {
        return code.ts()
      },
    }

    this._module = module
  }
  get module() {
    return this._module
  }
}

let _id = 0
type TypescriptOptions = {
  alias: Record<string, string>
  name: string
}
export async function typescript(code: string, options?: Partial<TypescriptOptions>): Promise<TsNode> {
  const id = options?.name || `${_id++}.ts`

  const jsCode = () => transpileToJS(modifyImportPaths(code, options?.alias))

  const tsCode = () => code

  // Transpile TypeScript to JavaScript
  const transpileToJS = (tsCode: string) => {
    const result = ts.transpileModule(tsCode, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ESNext,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
      },
    })
    return result.outputText
  }

  const path = () => {
    updateModule(id, tsCode())
    const url = URL.createObjectURL(
      new Blob([jsCode()], {
        type: 'application/javascript',
      })
    )
    return url
  }

  return new TsNode({ id, path, code: { js: jsCode, ts: tsCode }, module: await import(path()) })
}

function updateModule(fileName: string, newContent: string) {
  const file = tsModules[fileName]
  if (!file) {
    tsModules[fileName] = { content: newContent, version: 0 }
  } else {
    file.content = newContent
    file.version++
  }
}
