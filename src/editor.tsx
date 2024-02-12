import { when } from '@bigmistqke/when'
import loader, { Monaco } from '@monaco-editor/loader'
import { Component, ComponentProps, createEffect, createResource, onMount, splitProps, untrack } from 'solid-js'

const [monaco] = createResource(() => {
  try {
    return loader.init() as Promise<Monaco>
  } catch (error) {
    console.error('error', error)
    return undefined
  }
})

export const Editor: Component<
  Omit<ComponentProps<'div'>, 'onBlur'> & {
    initialValue?: string
    onBlur: (code: string, monaco: Monaco) => void
    onInitialized?: (code: string, monaco: Monaco) => void
    autoFocus?: boolean
  }
> = (props) => {
  let container: HTMLDivElement
  const [, htmlProps] = splitProps(props, ['initialValue', 'onBlur', 'onInitialized'])

  createEffect(() => {
    when(monaco)((monaco) => {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        noEmit: true,
        esModuleInterop: true,
      })
      const editor = monaco.editor.create(container, {
        value: props.initialValue || '',
        language: 'typescript',
        automaticLayout: true,
      })
      if (props.autoFocus) {
        editor.focus()
        if (container.parentElement) {
          container.parentElement.scrollTop = container.offsetTop
        }
      }

      untrack(() => props.onInitialized?.(editor.getValue(), monaco))
      editor.onDidBlurEditorText(() => props.onBlur(editor.getValue(), monaco))
    })
  })

  onMount(() => {
    let timeout: ReturnType<typeof setTimeout>
    new ResizeObserver(() => {
      container.style.overflow = 'hidden'
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        container.style.overflow = 'visible'
      }, 250)
    }).observe(container)
  })

  return <div ref={container!} {...htmlProps} />
}
