import { ComponentProps } from 'solid-js'

import clsx from 'clsx'
import styles from './group.module.css'

export const Group = (props: ComponentProps<'div'>) => (
  <div {...props} class={clsx(props.class, styles.group)}>
    {props.children}
  </div>
)
