import { Monaco } from '@monaco-editor/loader'
import clsx from 'clsx'
import { For, Resource, Show, createEffect, createMemo, createResource, createSignal, mapArray } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { when } from '../utils'

import { Button } from '../App'
import { TsNode, typescript } from '../typescript-esm'
import { Editor } from './editor/editor'

import general from '../general.module.css'
import grid from './editor-panel-grid.module.css'
import styles from './editor-panel.module.css'
import { Test, TestEditor } from './test-editor'

export const EditorPanel = (props: { onUpdate: (modules: Resource<any>[]) => void }) => {
  const [setup, setSetup] = createSignal<TsNode>()
  const [tests, setTests] = createStore<Test[]>([
    {
      autoFocus: false,
      description: '',
      title: 'Test 0',
      code: `import { arr } from "./setup";
      
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
      code: `import { arr } from "./setup";
      
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
      code: `import { arr } from "./setup";
      
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
        code: `import { } from "./setup"

export default () => {

}`,
        module: undefined,
        getModule: undefined,
        autoFocus: true,
      },
    ])
  }

  const alias = () => when(setup()?.path)((setup) => ({ './setup': setup }))

  const updateSetup = async (code: string, monaco: Monaco) => {
    const result = await typescript(code, { name: 'setup.ts' })
    setSetup(result)
  }

  const modules = createMemo(
    mapArray(
      () => tests,
      (test) =>
        createResource(
          () => [test.getModule, alias()],
          ([getModule]) => when(() => test.getModule, alias)((getModule, alias) => getModule(alias))
        )[0]
    )
  )

  createEffect(() => props.onUpdate(modules()))

  createEffect(() => console.log(modules().map((v) => v())))

  return (
    <div class={general.panel}>
      <div class={clsx(grid['content-grid'], styles['editor-panel'])}>
        <h2 class={grid.break}>Set Up</h2>
        <Editor
          initialValue='export const arr = new Array(1000).fill("").map((v,i) => i);'
          class={styles.editor}
          onInitialized={updateSetup}
          onBlur={updateSetup}
          name="setup"
        />
        <h2 class={grid.break}>Tests</h2>
        <div class={clsx(grid.extra, general.sticky, general.center)} style={{ gap: '10px' }}>
          <Button class={general['extra-button']} onClick={addTest}>
            add
          </Button>
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
                  console.log('getModule', getModule)
                  setTests(i(), { getModule })
                }}
                onDelete={() => {
                  setTests(
                    produce((tests) => {
                      tests.splice(i(), 1)
                    })
                  )
                }}
              />
            )}
          </For>
        </Show>
      </div>
    </div>
  )
}
