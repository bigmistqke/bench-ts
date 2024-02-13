import loader, { Monaco } from '@monaco-editor/loader'
import {
  Component,
  ComponentProps,
  createEffect,
  createMemo,
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

createEffect(() =>
  when(monaco)((monaco) => {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
    })
  })
)
const [typescriptWorker] = createResource(() =>
  when(monaco)((monaco) => monaco.languages.typescript.getTypeScriptWorker())
)
export const Editor: Component<
  Omit<ComponentProps<'div'>, 'onBlur'> & {
    initialValue?: string
    onBlur: (code: string, monaco: Monaco) => void
    onInitialized?: (code: string, monaco: Monaco) => void
    autoFocus?: boolean
    name: string
  }
> = (props) => {
  let container: HTMLDivElement
  const [isResizing, setIsResizing] = createSignal(false)
  const [, htmlProps] = splitProps(props, ['initialValue', 'onBlur', 'onInitialized'])
  const [height, setHeight] = createSignal(200)

  const model = createMemo(() =>
    when(monaco)((monaco) =>
      monaco.editor.createModel(props.initialValue || '', 'typescript', monaco.Uri.parse(`file:///${props.name}.ts`))
    )
  )

  const [client] = createResource(() => when(typescriptWorker, model)((worker, model) => worker(model.uri)))
  const [code, setCode] = createSignal<string>()

  const [transpiled] = createResource(all(client, code), ([client, code]) =>
    client.getEmitOutput(code).then((result) => {
      if (result.outputFiles.length > 0) {
        return result.outputFiles[0].text
      }
    })
  )

  createEffect(() => {
    when(
      monaco,
      model
    )(async (monaco, model) => {
      const editor = monaco.editor.create(container, {
        value: props.initialValue || '',
        language: 'typescript',
        automaticLayout: true,
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
        props.onBlur(editor.getValue(), monaco)
        model.setValue(value)
        setCode(value)
      })
    })
  })

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
