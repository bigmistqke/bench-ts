import clsx from 'clsx'
import { For, createEffect, createSignal } from 'solid-js'
import { createStore, produce } from 'solid-js/store'

import { Button } from '../components/button'
import { Editor } from './editor/editor'
import { Test, TestEditor } from './test-editor'

import general from '../general.module.css'
import grid from './editor-panel-grid.module.css'

export const EditorPanel = (props: { onUpdate: (modules: (((...args: any[]) => any) | undefined)[]) => void }) => {
  const [alias, setAlias] = createSignal<Record<string, string>>()
  const [tests, setTests] = createStore<Test[]>([
    {
      autoFocus: false,
      description: 'loop through array with for loop',
      title: 'Test 0',
      code: `import { arr } from "./setup";
      
export default () => {
  let sum = 0;
  for(let i = 0; i < arr.length; i++){
    sum += arr[i]
  }
}`,
      module: undefined,
    },
    {
      autoFocus: false,
      description: 'loop through array with forEach',
      title: 'Test 1',
      code: `import { arr } from "./setup";
      
export default () => {
  let sum = 0;
  arr.forEach(value => sum += value)
}`,
      module: undefined,
    },
    {
      autoFocus: false,
      description: 'loop through array with reduce',
      title: 'Test 2',
      code: `import { arr } from "./setup";
      
export default () => {
  let sum = arr.reduce((a,b) => a + b)
}`,
      module: undefined,
    },
    {
      autoFocus: false,
      description: 'loop through array with map',
      title: 'Test 3',
      code: `import { arr } from "./setup";
      
export default () => {
  let sum = 0;
  arr.map(value => sum += value)
}`,
      module: undefined,
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
      <div class={clsx(grid['content-grid'])}>
        <h2 class={grid.break}>Set Up</h2>
        <Editor
          initialValue='export const arr = new Array(100_000).fill("").map((v,i) => i);'
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
              test={test}
              alias={alias()}
              shouldCompile={alias() !== undefined}
              setTest={(...args) => setTests(i(), ...args)}
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
