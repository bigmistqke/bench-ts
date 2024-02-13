// @refresh reload
import clsx from 'clsx'
import { Resource, createSignal } from 'solid-js'

import { EditorPanel } from './editor-panel/editor-panel'
import { ResultPanel, ResultType } from './result-panel/result-panel'

import './app.css'
import styles from './app.module.css'
import { SideBar } from './side-bar/side-bar'
import { waitFor, when } from './utils'

export default function App() {
  const [mode, setMode] = createSignal<'dark' | 'light'>(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )
  const [modules, setModules] = createSignal<Resource<Record<string, any>>[]>([])
  const [results, setResults] = createSignal<{ bestTotal: number; results: (ResultType | undefined)[] }>()
  const [runCount, setRunCount] = createSignal<number | undefined>(undefined)

  const AMOUNT = 100

  let runId = 0

  const runTests = () =>
    when(modules)(async (modules) => {
      if (modules.every((v) => !v)) return
      runId++
      const id = runId
      setRunCount(0)
      const run = async () => {
        if (id !== runId) throw true
        const results: (Omit<ResultType, 'mean'> | undefined)[] = []
        for (let i = 0; i < modules.length; i++) {
          if (id !== runId) throw true
          const module = modules[i]!
          try {
            if (!module || !(typeof module === 'function')) {
              results[i] = undefined
            } else {
              let times: number[] = new Array(AMOUNT)
              let highest = 0
              let lowest = Infinity

              for (let j = 0; j < AMOUNT; j++) {
                if (id !== runId) throw true
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
                // await waitFor(0)
                setRunCount((c) => (c !== undefined ? c + 1 : undefined))
              }
              const total = times?.reduce((a, b) => a + b)

              results[i] = {
                total,
                highest,
                lowest,
              }
              await waitFor(50)
            }
          } catch (err) {
            if (err !== true) console.error(err)
            results[i] = undefined
          }
        }
        return results
      }

      try {
        const results = await run()

        let bestTotal = Infinity
        results.forEach((result) => {
          if (!result) return
          if (result.total < bestTotal) bestTotal = result.total
        })

        if (id !== runId) throw true

        setResults({ bestTotal, results })
        setRunCount(undefined)
      } catch (err) {}
    })

  /* createEffect(() => {
    if (results.length !== 0) return
    when(modules)((modules) => {
      if (modules.length > 0) {
        runTests()
      }
    })
  }) */

  return (
    <main class={clsx(styles.main, styles[mode()])}>
      <SideBar setMode={setMode} mode={mode()} />
      <EditorPanel onUpdate={setModules} />
      <ResultPanel
        amount={AMOUNT}
        runCount={runCount()}
        runTests={runTests}
        results={results()}
        loading={modules().every((v) => !v)}
      />
    </main>
  )
}
