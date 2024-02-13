import clsx from 'clsx'
import { Component, createSignal } from 'solid-js'
import { when } from '../utils'

import { Button } from '../App'
import { TsNode, typescript } from '../typescript-esm'
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
export const TestEditor: Component<{
  autoFocus: boolean
  title: string
  alias?: Record<string, string>
  code: string
  onUpdate: (getModule: Test['getModule']) => void
  onDelete: () => void
}> = (props) => {
  const [code, setCode] = createSignal<string>(props.code)
  let id = (_id++).toString()

  props.onUpdate((alias) => when(code)(async (code) => (await typescript(code, { alias })).module))

  return (
    <>
      <div class={clsx(grid.break, styles['editor-title'])}>
        <h3>{props.title}</h3>
        <Button class={grid['test-button']} onClick={props.onDelete}>
          delete
        </Button>
      </div>
      <Editor
        autoFocus={props.autoFocus}
        initialValue={props.code}
        class={styles.editor}
        onBlur={setCode}
        onInitialized={setCode}
        name={id}
      />
    </>
  )
}
