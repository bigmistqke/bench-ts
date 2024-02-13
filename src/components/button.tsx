import clsx from 'clsx'
import { Component, ComponentProps } from 'solid-js'

import styles from './button.module.css'

export const Button: Component<ComponentProps<'button'>> = (props) => {
  return (
    <div class={clsx(styles.button, props.class)}>
      <button onClick={props.onClick}>{props.children}</button>
    </div>
  )
}
