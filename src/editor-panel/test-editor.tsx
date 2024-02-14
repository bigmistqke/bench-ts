import clsx from 'clsx'
import { Component, ComponentProps, splitProps } from 'solid-js'

import { Button } from '../components/clickable'
import { Editor } from './editor/editor'

import grid from './editor-panel-grid.module.css'

import styles from './test-editor.module.css'

import { SetStoreFunction } from 'solid-js/store'
import { TextArea } from '../components/text-area'
import { store } from '../store'
import { Group } from './group'

export type Test = {
  description: string
  code: string
}

let _id = 0
export const TestEditor: Component<
  Omit<ComponentProps<typeof Editor>, 'name' | 'title' | 'description' | 'onCompilation' | 'mode'> & {
    onDelete: () => void
    test: Test
    setTest: SetStoreFunction<Test>
    setModule: (module: () => void) => void
    index: number
  }
> = (props) => {
  const [, rest] = splitProps(props, ['test'])
  let id = (_id++).toString()
  return (
    <>
      <Group>
        <div class={clsx(styles['editor-title'])}>
          <h3 id={`Test${props.index}`}>Test {props.index}</h3>
          <Button class={grid['test-button']} onClick={props.onDelete}>
            delete
          </Button>
        </div>
        <TextArea value={props.test.description} onInput={(e) => props.setTest('description', e.currentTarget.value)} />
        <Editor
          {...props.test}
          {...rest}
          onCompilation={({ module }) => props.setModule(module.default)}
          shouldCompile={props.shouldCompile}
          initialValue={props.test.code}
          onBlur={(code) => props.setTest({ code })}
          class={styles.editor}
          name={id}
          alias={props.alias}
          mode={store.styles.mode}
        />
      </Group>
    </>
  )
}
