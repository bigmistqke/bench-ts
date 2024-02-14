import { ComponentProps } from 'solid-js'

import clsx from 'clsx'
import styles from './input.module.css'

export const Input = (props: ComponentProps<'input'>) => (
  <div class={clsx(props.class, styles['input-container'])}>
    <input {...props} class={styles.input} />
  </div>
)
