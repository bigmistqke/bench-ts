import clsx from 'clsx'
import { For, Show, untrack } from 'solid-js'

import { Button } from '../components/clickable'
import { actions, store } from '../store'

import general from '../general.module.css'
import { OptionsPanel } from './options-panel'
import grid from './result-panel-grid.module.css'
import styles from './result-panel.module.css'

export type ResultType = { highest: number; lowest: number; total: number }

const order: (keyof ResultType)[] = ['total', 'highest', 'lowest']

export const Result = (props: { result: ResultType | undefined; index: number; bestTotal: number }) => (
  <>
    <div class={clsx(styles['title-container'], grid.break)}>
      <div class={styles.title}>
        <h3>
          <a href={`#Test${props.index}`}>Test {props.index}</a>
        </h3>
        <span style={{ color: props.result?.total === props.bestTotal ? 'green' : 'red' }}>
          <Show when={props.result} fallback="error">
            {props.result!.total === props.bestTotal ? 1 : (props.result!.total / props.bestTotal).toFixed(2)}
          </Show>
        </span>
      </div>
      <Show when={store.tests[props.index].description}>
        <span class={styles.description}>{untrack(() => store.tests[props.index].description)}</span>
      </Show>
    </div>
    <div style={{ 'margin-bottom': '25px' }}>
      <Show when={props.result}>
        {(result) => (
          <>
            <div class={styles.results}>
              <label>mean</label>
              <span>{(result().total / store.options.amount).toFixed(2)}ms</span>
              <For each={order}>
                {(key) => (
                  <>
                    <label>{key}</label>
                    <span>{result()[key].toFixed(2)}ms</span>
                  </>
                )}
              </For>
            </div>
          </>
        )}
      </Show>
    </div>
  </>
)

export const ResultPanel = (props: { loading: boolean }) => (
  <div class={clsx(general.panel, styles['result-panel-container'])}>
    <div
      class={clsx(
        styles['result-panel'],
        grid['content-grid'],
        typeof store.results.count === 'number' && styles.running
      )}
    >
      <h2 class={grid.break}>Results</h2>
      <div class={clsx(grid.extra, general.sticky, general.center)} style={{ gap: '10px' }}>
        <Button
          class={general['extra-button']}
          onClick={() => !store.results.count !== undefined && !props.loading && actions.runTests()}
        >
          {store.results.count !== undefined ? `(${store.results.count})` : props.loading ? 'loading' : 'run'}
        </Button>
      </div>
      <Show when={store.results.bestTotal}>
        {(bestTotal) => (
          <For each={store.results.values}>
            {(result, index) => <Result result={result} index={index()} bestTotal={bestTotal()} />}
          </For>
        )}
      </Show>
    </div>
    <OptionsPanel />
  </div>
)
