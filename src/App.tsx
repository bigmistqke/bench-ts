// @refresh reload
import clsx from 'clsx'

import { EditorPanel } from './editor-panel/editor-panel'
import { ResultPanel } from './result-panel/result-panel'

import './app.css'
import styles from './app.module.css'
import { SideBar } from './side-bar/side-bar'
import { store } from './store'

export default function App() {
  return (
    <main class={clsx(styles.main, styles[store.styles.mode])}>
      <SideBar />
      <EditorPanel />
      <ResultPanel loading={store.modules.every((module) => !module)} />
    </main>
  )
}
