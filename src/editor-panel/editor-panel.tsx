import clsx from 'clsx'
import { For, Resource, createEffect, createSignal } from 'solid-js'
import { createStore, produce } from 'solid-js/store'

import { Button } from '../App'
import { Editor } from './editor/editor'

import general from '../general.module.css'
import grid from './editor-panel-grid.module.css'
import styles from './editor-panel.module.css'
import { Test, TestEditor } from './test-editor'

export const EditorPanel = (props: { onUpdate: (modules: Resource<any>[]) => void }) => {
  const [alias, setAlias] = createSignal<Record<string, string>>()
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

  createEffect(() => props.onUpdate(tests.map((v) => v.module)))

  return (
    <div class={general.panel}>
      <div class={clsx(grid['content-grid'], styles['editor-panel'])}>
        <h2 class={grid.break}>Set Up</h2>
        <Editor
          initialValue='export const arr = new Array(1000).fill("").map((v,i) => i);'
          class={styles.editor}
          onCompilation={(module) => setAlias({ './setup': module.url, './setup.ts': module.url })}
          name="setup"
          alias={{}}
        />
        <h2 class={grid.break}>Tests</h2>
        <div class={clsx(grid.extra, general.sticky, general.center)} style={{ gap: '10px' }}>
          <Button class={general['extra-button']} onClick={addTest}>
            add
          </Button>
        </div>
        <For each={tests}>
          {(test, i) => (
            <TestEditor
              alias={alias()}
              autoFocus={test.autoFocus}
              initialValue={test.code}
              title={test.title}
              shouldCompile={alias() !== undefined}
              onCompilation={({ module }) => {
                setTests(i(), { module: module.default })
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
      </div>
    </div>
  )
}
