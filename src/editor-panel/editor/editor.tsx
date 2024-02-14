import loader, { Monaco } from '@monaco-editor/loader'
import {
  Component,
  ComponentProps,
  createEffect,
  createMemo,
  createRenderEffect,
  createResource,
  createSignal,
  splitProps,
  untrack,
} from 'solid-js'

import { all, cursor, when } from '../../utils'

import clsx from 'clsx'
import styles from './editor.module.css'

export const [monaco] = createResource(() => {
  try {
    return loader.init() as Promise<Monaco>
  } catch (error) {
    console.error('error', error)
    return undefined
  }
})

const [typescriptWorker, setTypescriptWorker] =
  createSignal<Awaited<ReturnType<Monaco['languages']['typescript']['getTypeScriptWorker']>>>()

createRenderEffect(() =>
  when(monaco)(async (monaco) => {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
    })
    const worker = await monaco.languages.typescript.getTypeScriptWorker()
    setTypescriptWorker(() => worker)
  })
)

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

export const Editor: Component<
  Omit<ComponentProps<'div'>, 'onBlur'> & {
    initialValue?: string
    onBlur?: (code: string, monaco: Monaco) => void
    onInitialized?: (code: string, monaco: Monaco) => void
    onCompilation?: (module: { module: Record<string, any>; url: string }) => void
    shouldCompile?: boolean
    autoFocus?: boolean
    name: string
    alias?: Record<string, string>
    mode: 'light' | 'dark'
  }
> = (props) => {
  let container: HTMLDivElement
  const [isResizing, setIsResizing] = createSignal(false)
  const [, htmlProps] = splitProps(props, ['initialValue', 'onBlur', 'onInitialized'])
  const [height, setHeight] = createSignal(200)

  const model = createMemo(() =>
    when(monaco)((monaco) =>
      monaco.editor.createModel(
        untrack(() => props.initialValue) || '',
        'typescript',
        monaco.Uri.parse(`file:///${props.name}.ts`)
      )
    )
  )

  const [client] = createResource(all(typescriptWorker, model), ([worker, model]) => worker(model.uri))

  const [code, setCode] = createSignal<string | undefined>(props.initialValue)

  const [module] = createResource(
    all(client, model, code, () => props.shouldCompile !== false),
    async ([client, model]) =>
      client.getEmitOutput(`file://${model.uri.path}`).then(async (result) => {
        if (result.outputFiles.length > 0) {
          // get module-url of transpiled code
          const url = URL.createObjectURL(
            new Blob(
              [
                // replace local imports with their respective module-urls
                modifyImportPaths(result.outputFiles[0].text, props.alias),
              ],
              {
                type: 'application/javascript',
              }
            )
          )
          const module = await import(/* @vite-ignore */ url)

          return {
            url,
            module,
          }
        }
      })
  )

  createEffect(() => {
    when(
      monaco,
      model
    )(async (monaco, model) => {
      const editor = monaco.editor.create(container, {
        value: untrack(() => props.initialValue) || '',
        language: 'typescript',
        automaticLayout: true,
        theme: untrack(() => props.mode) === 'dark' ? 'vs-dark' : 'vs-light',
        model,
      })

      if (props.autoFocus) {
        editor.focus()
        if (container.parentElement?.parentElement?.parentElement) {
          container.parentElement.parentElement.parentElement.scrollTop = container.offsetTop
        }
      }

      untrack(() => props.onInitialized?.(editor.getValue(), monaco))
      editor.onDidBlurEditorText(() => {
        const value = editor.getValue()
        props.onBlur?.(editor.getValue(), monaco)
        model.setValue(value)
        setCode(value)
      })

      createEffect(() => {
        console.log('set theme!!!')
        monaco.editor.setTheme(props.mode === 'light' ? 'vs-light' : 'vs-dark')
      })
    })
  })

  createEffect(() => when(module)((module) => props.onCompilation?.(module)))

  const onMouseDown = async (e: MouseEvent) => {
    const start = height()
    setIsResizing(true)
    await cursor(e, (delta) => {
      setHeight(start - delta.y)
    })
    setIsResizing(false)
  }

  return (
    <>
      <div
        class={clsx(styles['editor-container'], isResizing() && styles.resizing)}
        style={{
          height: `${height()}px`,
        }}
      >
        <div ref={container!} {...htmlProps} class={styles['editor']} />
        <div class={styles['resize-bar']} onMouseDown={onMouseDown} />
      </div>
    </>
  )
}
