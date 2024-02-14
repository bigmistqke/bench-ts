import clsx from 'clsx'
import { For, createSignal } from 'solid-js'
import { produce } from 'solid-js/store'

import { Button } from '../components/clickable'
import { Editor } from './editor/editor'
import { TestEditor } from './test-editor'

import { TextArea } from '../components/text-area'
import general from '../general.module.css'
import { actions, setStore, store } from '../store'
import grid from './editor-panel-grid.module.css'

export const EditorPanel = () => {
  const [alias, setAlias] = createSignal<Record<string, string>>()
  return (
    <div class={general.panel}>
      <div class={clsx(grid['content-grid'])}>
        <h2 class={grid.break}>Description</h2>
        <TextArea value={store.description} onInput={(e) => setStore('description', e.currentTarget.value)} />

        <h2 class={grid.break}>Set Up</h2>

        <Editor
          alias={{}}
          initialValue={store.setup}
          mode={store.styles.mode}
          name="setup"
          onBlur={(code) => setStore('setup', code)}
          onCompilation={(module) => setAlias({ './setup': module.url, './setup.ts': module.url })}
        />

        <h2 class={grid.break}>Tests</h2>
        <div class={clsx(grid.extra, general.sticky, general.center)} style={{ gap: '10px', top: '50px' }}>
          <Button class={general['extra-button']} onClick={actions.addTest}>
            add
          </Button>
        </div>
        <For each={store.tests}>
          {(test, i) => (
            <TestEditor
              index={i()}
              alias={alias()}
              onDelete={() => {
                setStore(
                  'tests',
                  produce((tests) => {
                    tests.splice(i(), 1)
                  })
                )
              }}
              setModule={(module) => setStore('modules', i(), () => module)}
              setTest={(...args) => setStore('tests', i(), ...args)}
              shouldCompile={alias() !== undefined}
              test={test}
            />
          )}
        </For>
      </div>
    </div>
  )
}
