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
function generateModuleDeclaration(fileName: string) {
  const program = languageService.getProgram()
  if (!program) return
  const sourceFile = program.getSourceFile(fileName)
  if (!sourceFile) return
  const checker = program.getTypeChecker()
  const symbol = checker.getSymbolAtLocation(sourceFile)
  if (!symbol) return
  const exports = checker.getExportsOfModule(symbol)

  let declaration = `declare module "${fileName.split('.')[0]}" {\n`
  exports.forEach((exp) => {
    const type = checker.getTypeOfSymbolAtLocation(exp, exp.valueDeclaration)
    const typeName = checker.typeToString(type)
    declaration += `  export const ${exp.getName()}: ${typeName};\n`
  })
  declaration += `}`

  return declaration
}
const load = (url: Accessor<string>) => import(url())

export class TsNode {
  id: string
  path: Accessor<string>
  declaration: string
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
    this.declaration = generateModuleDeclaration(id)!

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
  getType(symbolName: string) {
    return getType(this.id, symbolName)
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

const servicesHost: ts.LanguageServiceHost = {
  getScriptFileNames: () => Object.keys(tsModules),
  getScriptVersion: (fileName) => tsModules[fileName].version.toString(),
  getScriptSnapshot: (fileName) => {
    return ts.ScriptSnapshot.fromString(tsModules[fileName].content)
  },
  getCurrentDirectory: () => '/',
  getCompilationSettings: () => ({
    noLib: true,
    allowJs: true,
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
  }),
  getDefaultLibFileName: () => 'lib.d.ts',
  fileExists: (fileName) => !!tsModules[fileName],
  readFile: (fileName: string) => tsModules[fileName].content || '',
  resolveModuleNames(moduleNames) {
    return moduleNames.map((name) => {
      // If we're dealing with relative paths, normalize them
      if (name.startsWith('./')) {
        name = name.substring(2)
      }

      if (tsModules[name]) {
        return {
          resolvedFileName: name,
          extension: '.ts',
        }
      }

      return undefined // The module couldn't be resolved
    })
  },
}

const languageService = ts.createLanguageService(servicesHost, ts.createDocumentRegistry())

function getType(fileName: string, symbolName: string) {
  const program = languageService.getProgram()!
  const sourceFile = program.getSourceFile(fileName)!
  const checker = program.getTypeChecker()

  function findNodeByName(sourceFile: ts.SourceFile, name: string) {
    let foundNode = null
    function visit(node: ts.SourceFile | ts.Node) {
      if (ts.isIdentifier(node) && node.getText() === name) {
        foundNode = node
        return
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
    return foundNode
  }

  const node = findNodeByName(sourceFile, symbolName)!
  const type = checker.getTypeAtLocation(node)
  return checker.typeToString(type)
}
