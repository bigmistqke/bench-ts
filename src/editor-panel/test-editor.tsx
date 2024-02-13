import clsx from 'clsx'
import { Component, ComponentProps, createSignal } from 'solid-js'

import { Button } from '../App'
import { TsNode } from '../typescript-esm'
import { Editor } from './editor/editor'

import grid from './editor-panel-grid.module.css'
import styles from './editor-panel.module.css'

export type Test = {
  autoFocus: boolean
  description: string
  title: string
  code: string
  getModule: ((alias: Record<string, string>) => TsNode['module']) | undefined
  module: TsNode['module'] | undefined
}

let _id = 0
export const TestEditor: Component<
  Omit<ComponentProps<typeof Editor>, 'onBlur' | 'onInitialized' | 'name'> & {
    title: string
    // onUpdate: (getModule: Test['getModule']) => void
    onDelete: () => void
  }
> = (props) => {
  const [code, setCode] = createSignal<string>(props.initialValue || '')
  let id = (_id++).toString()

  // props.onUpdate((alias) => when(code)(async (code) => (await typescript(code, { alias })).module))

  return (
    <>
      <div class={clsx(grid.break, styles['editor-title'])}>
        <h3>{props.title}</h3>
        <Button class={grid['test-button']} onClick={props.onDelete}>
          delete
        </Button>
      </div>
      <Editor {...props} class={styles.editor} onBlur={setCode} onInitialized={setCode} name={id} alias={props.alias} />
    </>
  )
}
