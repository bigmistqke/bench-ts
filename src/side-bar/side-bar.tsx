import { createSignal } from 'solid-js'
import { Button, Link } from '../components/clickable'

import general from '../general.module.css'
import { saveToUrl, setStore, store } from '../store'
import grid from './side-bar-grid.module.css'

export const SideBar = () => {
  const [saved, setSaved] = createSignal(false)
  return (
    <div class={general.panel}>
      <div class={grid.grid} style={{ 'margin-top': '10px' }}>
        <Button
          onClick={() => {
            setSaved(true)
            saveToUrl()
            navigator.clipboard.writeText(window.location.href.split('#')[0])
            setTimeout(() => setSaved(false), 3000)
          }}
        >
          {saved() ? 'saved!' : 'save'}
        </Button>
        <Button onClick={() => setStore('styles', 'mode', (mode) => (mode === 'dark' ? 'light' : 'dark'))}>
          {store.styles.mode === 'dark' ? 'lighten' : 'darken'}
        </Button>
        <Link href="https://www.github.com/bigmistqke/bench-ts">github</Link>
      </div>
    </div>
  )
}
