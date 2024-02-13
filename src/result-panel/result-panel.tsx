import clsx from 'clsx'
import { For, Show } from 'solid-js'

import { Button } from '../components/button'

import general from '../general.module.css'
import grid from './result-panel-grid.module.css'
import styles from './result-panel.module.css'

export type ResultType = { highest: number; lowest: number; total: number }

const order: (keyof ResultType)[] = ['total', 'highest', 'lowest']

export const ResultPanel = (props: {
  results: { bestTotal: number; results: (ResultType | undefined)[] } | undefined
  runTests: () => void
  runCount: number | undefined
  loading: boolean
  amount: number
}) => {
  return (
    <div class={clsx(general.panel, styles['result-panel-container'])}>
      <div
        class={clsx(styles['result-panel'], grid['content-grid'], typeof props.runCount === 'number' && styles.running)}
      >
        <h2 class={grid.break}>Results</h2>
        <div class={clsx(grid.extra, general.sticky, general.center)} style={{ gap: '10px' }}>
          <Button
            class={general['extra-button']}
            onClick={() => !props.runCount !== undefined && !props.loading && props.runTests()}
          >
            {props.runCount !== undefined ? `(${props.runCount})` : props.loading ? 'loading' : 'run'}
          </Button>
        </div>
        <Show when={props.results}>
          {(results) => (
            <For each={results().results}>
              {(result, index) => (
                <>
                  <div class={clsx(styles.title, grid.break)}>
                    <h3>
                      <a href={`#Test${index()}`}>Test {index()}</a>
                    </h3>
                    <span style={{ color: result?.total === results().bestTotal ? 'green' : 'red' }}>
                      <Show when={result} fallback="error">
                        {result!.total === results().bestTotal ? 1 : (result!.total / results().bestTotal).toFixed(2)}
                      </Show>
                    </span>
                  </div>
                  <div>
                    <Show when={result}>
                      {(result) => (
                        <>
                          <div class={styles.result}>
                            <label class={clsx(grid.label, styles.result)}>mean</label>
                            <span class={clsx(grid.result, styles.result)}>
                              {(result().total / props.amount).toFixed(2)}ms
                            </span>
                          </div>
                          <For each={order}>
                            {(key) => (
                              <div class={styles.result}>
                                <label class={clsx(grid.label, styles.result)}>{key}</label>
                                <span class={clsx(grid.result, styles.result)}>{result()[key].toFixed(2)}ms</span>
                              </div>
                            )}
                          </For>
                        </>
                      )}
                    </Show>
                  </div>
                </>
              )}
            </For>
          )}
        </Show>
      </div>
    </div>
  )
}
