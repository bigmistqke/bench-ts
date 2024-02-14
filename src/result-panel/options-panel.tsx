import clsx from 'clsx'
import { ComponentProps, createSignal, Show, splitProps } from 'solid-js'
import { Button, CheckBox } from '../components/clickable'
import { Input } from '../components/input'

import general from '../general.module.css'
import { setStore, store } from '../store'
import styles from './options-panel.module.css'
import grid from './result-panel-grid.module.css'

const InputCheckBox = (props: ComponentProps<typeof Input> & { onClick: () => void }) => {
  let ref: HTMLInputElement
  const [checkbox] = splitProps(props, ['onClick'])
  return (
    <>
      <Input ref={ref!} class={styles['input-short']} type="number" {...props} />
      <CheckBox
        checked={props.value !== undefined}
        onClick={() => {
          checkbox.onClick()
          if (props.value !== undefined) {
            ref.select()
          }
        }}
      />
    </>
  )
}

export const OptionsPanel = () => {
  const [optionsVisible, setOptionsVisible] = createSignal(false)
  return (
    <div class={clsx(styles['options-panel'], grid['content-grid'], optionsVisible() && styles['options-visible'])}>
      <h2 class={grid.break}>Options</h2>
      <div class={clsx(grid.extra, general.sticky, general.center)} style={{ gap: '10px' }}>
        <Button onClick={() => setOptionsVisible((v) => !v)}>{optionsVisible() ? 'close' : 'open'}</Button>
      </div>
      <Show when={optionsVisible()}>
        <div class={clsx(styles.options)}>
          <label class={styles.label}>amount</label>
          <Input
            class={styles.input}
            type="number"
            value={store.options.amount}
            onInput={(e) => setStore('options', 'amount', +e.currentTarget.value)}
          />
          <label class={styles.label}>delay between</label>
          <InputCheckBox
            value={store.options.delayBetween}
            onInput={(e) => setStore('options', 'delayBetween', +e.currentTarget.value)}
            onClick={() => setStore('options', 'delayBetween', (v) => (typeof v === 'undefined' ? 0 : undefined))}
          />
          <label class={styles.label}>delay after</label>
          <InputCheckBox
            value={store.options.delayAfter}
            onInput={(e) => setStore('options', 'delayAfter', +e.currentTarget!.value)}
            onClick={() => setStore('options', 'delayAfter', (v) => (typeof v === 'undefined' ? 0 : undefined))}
          />
        </div>
      </Show>
    </div>
  )
}
