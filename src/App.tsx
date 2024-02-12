// @refresh reload
import clsx from 'clsx'
import { Component, ComponentProps, For, Resource, Show, createSignal } from 'solid-js'

import { EditorPanel } from './editor-panel'

import { createStore } from 'solid-js/store'
import './app.css'
import app from './app.module.css'
import general from './general.module.css'
import grid from './result-panel-grid.module.css'

export const Button: Component<ComponentProps<'button'>> = (props) => {
  return (
    <div class={clsx(general.button, props.class)}>
      <button onClick={props.onClick}>{props.children}</button>
    </div>
  )
}

export default function App() {
  const [modules, setModules] = createSignal<Resource<Record<string, any>>[]>([])
  const [results, setResults] = createStore<({ mean: number; highest: number; total: number } | undefined)[]>([])

  const AMOUNT = 1000

  const runTests = () => {
    const _modules = modules()
    if (!_modules) return

    for (let i = 0; i < _modules.length; i++) {
      const module = _modules[i]!()
      if (!module || !(typeof module.default === 'function')) {
        setResults(i, undefined)
      } else {
        try {
          let results: number[] = new Array(AMOUNT)
          let highest = 0
          for (let j = 0; j < AMOUNT; j++) {
            const start = performance.now()
            module.default()
            const result = performance.now() - start
            if (result > highest) {
              highest = result
            }
            results[j] = result
          }
          const total = results?.reduce((a, b) => a + b)
          setResults(i, {
            total,
            mean: total / AMOUNT,
            highest,
          })
        } catch (err) {
          console.error(err)
          setResults(i, undefined)
        }
      }
    }
  }

  return (
    <main class={app.main}>
      <EditorPanel onUpdate={setModules} />
      <div class={clsx(results['results-panel'], general.panel, general.sticky, grid['content-grid'])}>
        <h2 class={grid['break-out']}>Results</h2>
        <div class={clsx(grid.extra, general.sticky, general.center)} style={{ gap: '10px' }}>
          <Button onClick={runTests}>run</Button>
        </div>
        <For each={results}>
          {(result, index) => (
            <>
              <h3 class={grid['break-out']}>Test {index()}</h3>
              <Show when={result}>
                {(result) => (
                  <For each={Object.entries(result())}>
                    {([key, value]) => (
                      <>
                        <label class={grid.label}>{key}</label>
                        <span class={grid.result}>{value.toFixed(4)}ms</span>
                      </>
                    )}
                  </For>
                )}
              </Show>
            </>
          )}
        </For>
      </div>
    </main>
  )
}
