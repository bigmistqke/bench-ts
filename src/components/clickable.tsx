import clsx from 'clsx'
import { Component, ComponentProps, Show, splitProps } from 'solid-js'

import styles from './clickable.module.css'

export const Button: Component<ComponentProps<'button'>> = (props) => {
  return (
    <div class={clsx(styles.clickable, props.class)} style={props.style}>
      <button onClick={props.onClick}>{props.children}</button>
    </div>
  )
}

export const Link: Component<ComponentProps<'a'>> = (props) => {
  const [container, anchor] = splitProps(props, ['class', 'style'])
  return (
    <div class={clsx(styles.clickable, container.class)} style={container.style}>
      <a {...anchor} target="_blank">
        {props.children}
      </a>
    </div>
  )
}

export const CheckBox = (props: { checked: boolean; onClick: () => void }) => {
  return (
    <button onClick={props.onClick} class={clsx(styles.checkbox, props.checked !== undefined && styles.active)}>
      <Show when={props.checked}>
        <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="0" x2="20" y2="20" />
          <line x1="0" y1="20" x2="20" y2="0" />
        </svg>
      </Show>
    </button>
  )
}
