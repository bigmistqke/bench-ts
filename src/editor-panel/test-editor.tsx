import clsx from 'clsx'
import { Component, ComponentProps, splitProps } from 'solid-js'

import { Button } from '../components/button'
import { Editor } from './editor/editor'

import grid from './editor-panel-grid.module.css'

import styles from './test-editor.module.css'

import { SetStoreFunction } from 'solid-js/store'
import TextArea from 'solid-textarea-autosize'

export type Test = {
  autoFocus: boolean
  description: string
  title: string
  code: string
  module: ((...args: any[]) => any) | undefined
}

let _id = 0
export const TestEditor: Component<
  Omit<ComponentProps<typeof Editor>, 'name' | 'title' | 'description' | 'onCompilation'> & {
    onDelete: () => void
    test: Test
    setTest: SetStoreFunction<Test>
  }
> = (props) => {
  const [, rest] = splitProps(props, ['test'])
  let id = (_id++).toString()
  return (
    <>
      <div class={clsx(grid.break, styles['editor-title'])}>
        <h3 id={props.test.title.replaceAll(' ', '')}>{props.test.title}</h3>
        <Button class={grid['test-button']} onClick={props.onDelete}>
          delete
        </Button>
      </div>
      <div class={styles['text-area-container']}>
        <TextArea
          class={styles['text-area']}
          value={props.test.description}
          onInput={(e) => props.setTest('description', e.currentTarget.value)}
        />
      </div>
      <Editor
        {...props.test}
        {...rest}
        onCompilation={({ module }) => props.setTest({ module: module.default })}
        shouldCompile={props.shouldCompile}
        initialValue={props.test.code}
        class={styles.editor}
        name={id}
        alias={props.alias}
      />
    </>
  )
}
