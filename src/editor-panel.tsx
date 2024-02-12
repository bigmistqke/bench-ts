import { when } from '@bigmistqke/when'
import { Monaco } from '@monaco-editor/loader'
import clsx from 'clsx'
import { Component, For, Show, createMemo, createResource, createSignal, mapArray } from 'solid-js'
import { createStore } from 'solid-js/store'

import { Button } from './App'
import { Editor } from './editor'
import { TsNode, typescript } from './typescript-esm'

import grid from './editor-panel-grid.module.css'
import styles from './editor-panel.module.css'
import general from './general.module.css'

export type Test = {
  autoFocus: boolean
  description: string
  title: string
  code: string
  getModule: ((alias: Record<string, string>) => TsNode['module']) | undefined
  module: TsNode['module'] | undefined
}

export const TestEditor: Component<{
  autoFocus: boolean
  title: string
  alias?: Record<string, string>
  code: string
  onUpdate: (setModule: (alias: Record<string, string>) => TsNode['module']) => void
}> = (props) => {
  const [code, setCode] = createSignal<string>()

  props.onUpdate(async (alias: Record<string, string>) =>
    when(code)(async (code) => {
      const result = await typescript(code, { alias })
      return result.module
    })
  )

  return (
    <>
      <h3 class={grid['break-out']}>{props.title}</h3>
      <Editor
        autoFocus={props.autoFocus}
        initialValue={props.code}
        class={styles.editor}
        onBlur={setCode}
        onInitialized={setCode}
      />
    </>
  )
}

export const EditorPanel = (props: {
  onUpdate: (callback: (modules: ((() => void) | undefined)[]) => void) => void
}) => {
  const [setup, setSetup] = createSignal<TsNode>()
  const [tests, setTests] = createStore<Test[]>([
    {
      autoFocus: false,
      description: '',
      title: 'Test 0',
      code: `import { arr } from "setup";
      
export default () => {
  let sum = 0;
  for(let i = 0; i < arr.length; i++){
    sum += arr[i]
  }
}`,
      module: undefined,
      getModule: undefined,
    },
    {
      autoFocus: false,
      description: '',
      title: 'Test 1',
      code: `import { arr } from "setup";
      
export default () => {
  let sum = 0;
  arr.forEach(value => sum += value)
}`,
      module: undefined,
      getModule: undefined,
    },
    {
      autoFocus: false,
      description: '',
      title: 'Test 2',
      code: `import { arr } from "setup";
      
export default () => {
  let sum = arr.reduce((a,b) => a + b)
}`,
      module: undefined,
      getModule: undefined,
    },
  ])

  const addTest = () => {
    setTests((test) => [
      ...test,
      {
        description: '',
        title: `Test ${test.length}`,
        code: '',
        module: undefined,
        getModule: undefined,
        autoFocus: true,
      },
    ])
  }

  const alias = () => when(setup()?.path)((setup) => ({ setup }))

  const updateSetup = async (code: string, monaco: Monaco) => {
    const result = await typescript(code, { name: 'setup.ts' })
    setSetup(result)
    console.log('update setup!!', result.declaration)
    monaco.languages.typescript.typescriptDefaults.addExtraLib(result.declaration, 'filename/setup.d.ts')
  }

  const modules = createMemo(
    mapArray(
      () => tests,
      (test, index) =>
        createResource(
          () => [test.getModule, alias()],
          () => when(() => test.getModule, alias)((getModule, alias) => getModule(alias))
        )[0]
    )
  )

  props.onUpdate(modules)

  return (
    <div class={clsx(grid['content-grid'], general.panel, styles['editor-panel'])}>
      <h2 class={grid['break-out']}>Set Up</h2>
      <Editor
        initialValue='export const arr = new Array(1000).fill("").map((v,i) => i);'
        class={styles.editor}
        onInitialized={updateSetup}
        onBlur={updateSetup}
      />
      <h2 class={grid['break-out']}>Tests</h2>
      <div class={clsx(grid.extra, general.sticky, general.center)} style={{ gap: '10px' }}>
        <Button onClick={addTest}>add</Button>
      </div>
      <Show when={setup}>
        <For each={tests}>
          {(test, i) => (
            <TestEditor
              autoFocus={test.autoFocus}
              code={test.code}
              title={test.title}
              alias={alias()}
              onUpdate={(getModule) => {
                setTests(i(), { getModule })
              }}
            />
          )}
        </For>
      </Show>
    </div>
  )
}
