// @refresh reload
import clsx from 'clsx'
import { Component, ComponentProps, Resource, createEffect, createSignal } from 'solid-js'

import { EditorPanel } from './editor-panel/editor-panel'
import { ResultPanel, ResultType } from './result-panel/result-panel'

import './app.css'
import app from './app.module.css'
import general from './general.module.css'
import { waitFor, when } from './utils'

export const Button: Component<ComponentProps<'button'>> = (props) => {
  return (
    <div class={clsx(general.button, props.class)}>
      <button onClick={props.onClick}>{props.children}</button>
    </div>
  )
}

export default function App() {
  const [modules, setModules] = createSignal<Resource<Record<string, any>>[]>([])
  const [results, setResults] = createSignal<{ bestTotal: number; results: (ResultType | undefined)[] }>()
  const [running, setRunning] = createSignal(false)

  const AMOUNT = 100

  const runTests = () =>
    when(modules)(async (modules) => {
      if (modules.every((v) => !v)) return
      setRunning(true)
      const run = async () => {
        const results: (Omit<ResultType, 'mean'> | undefined)[] = []
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i]!
          try {
            if (!module || !(typeof module === 'function')) {
              results[i] = undefined
            } else {
              let times: number[] = new Array(AMOUNT)
              let highest = 0
              let lowest = Infinity

              for (let j = 0; j < AMOUNT; j++) {
                const start = performance.now()
                module()
                const time = performance.now() - start
                if (time > highest) {
                  highest = time
                }
                if (time < lowest) {
                  lowest = time
                }
                times[j] = time
              }
              const total = times?.reduce((a, b) => a + b)

              results[i] = {
                total,
                highest,
                lowest,
              }
            }
          } catch (err) {
            console.error(err)
            results[i] = undefined
          } finally {
            // delay to gc
            await waitFor(100)
          }
        }
        return results
      }

      const runs = await Promise.all(Array.from({ length: 10 }).map((v) => run()))
      const results = runs.reduce((a, b) =>
        a.map((aItem, index) => {
          const bItem = b[index]
          if (!aItem || !bItem) return undefined
          return {
            total: aItem.total + bItem.total,
            highest: aItem.highest > bItem.highest ? aItem.highest : bItem.highest,
            lowest: aItem.lowest < bItem.lowest ? aItem.lowest : bItem.lowest,
          }
        })
      )

      let bestTotal = Infinity
      results.forEach((result) => {
        if (!result) return
        if (result.total < bestTotal) bestTotal = result.total
      })

      setResults({ bestTotal, results })
      setRunning(false)
    })

  createEffect(() => {
    if (results.length !== 0) return
    when(modules)((modules) => {
      if (modules.length > 0) {
        runTests()
      }
    })
  })

  return (
    <main class={app.main}>
      <EditorPanel onUpdate={setModules} />
      <ResultPanel runTests={runTests} results={results()} running={running()} loading={modules().every((v) => !v)} />
    </main>
  )
}
