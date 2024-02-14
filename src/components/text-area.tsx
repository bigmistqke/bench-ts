import clsx from 'clsx'
import { ComponentProps } from 'solid-js'
import TextareaAutosize from 'solid-textarea-autosize'

import styles from './text-area.module.css'

export const TextArea = (props: ComponentProps<typeof TextareaAutosize>) => (
  <div class={styles['text-area-container']}>
    <TextareaAutosize {...props} class={clsx(props.class, styles['text-area'])} />
  </div>
)
