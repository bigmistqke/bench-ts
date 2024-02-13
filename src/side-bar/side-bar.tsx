import { Setter } from 'solid-js'
import { Button } from '../components/button'

import general from '../general.module.css'
import grid from './side-bar-grid.module.css'

export const SideBar = (props: { mode: 'light' | 'dark'; setMode: Setter<'light' | 'dark'> }) => {
  return (
    <div class={general.panel}>
      <div class={grid.grid}>
        <Button>save</Button>
        <Button onClick={() => props.setMode((mode) => (mode === 'dark' ? 'light' : 'dark'))}>{props.mode}</Button>
      </div>
    </div>
  )
}
