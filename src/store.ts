import { createStore } from 'solid-js/store'
import { Test } from './editor-panel/test-editor'
import { ResultType } from './result-panel/result-panel'
import { waitFor, when } from './utils'

import { compressSync, decompressSync, strFromU8, strToU8 } from 'fflate'

function base64ToBytes(base64: string) {
  return Uint8Array.from(atob(base64), (m) => m.codePointAt(0)!)
}

function bytesToBase64(bytes) {
  return btoa(String.fromCodePoint(...bytes))
}

export function compress(s: string) {
  return bytesToBase64(compressSync(strToU8(JSON.stringify(s))))
}
export function uncompress(s: string) {
  return JSON.parse(strFromU8(decompressSync(base64ToBytes(s))))
}

const params = new URLSearchParams(window.location.search)
const state = params.get('state')
let jsonString = state ? uncompress(state) : undefined

export const [store, setStore] = createStore<{
  description: string
  tests: Test[]
  setup: { code: string; height: number }
  results: {
    count: undefined | number
    bestTotal: undefined | number
    values: (ResultType | undefined)[]
  }
  modules: (((...args: any[]) => any) | undefined)[]
  options: {
    amount: number
    delayBetween: number | undefined
    delayAfter: number | undefined
  }
  styles: {
    mode: 'light' | 'dark'
  }
}>({
  ...(() => {
    if (jsonString) {
      return JSON.parse(jsonString)
    }
    return {
      description: 'various looping functions',
      tests: [
        {
          description: 'loop through array with for loop',
          code: `import { arr } from "./setup";
        
export default () => {
  let sum = 0;
  for(let i = 0; i < arr.length; i++){
    sum += arr[i]
  }
}`,
          height: 200,
        },
        {
          description: 'loop through array with forEach',
          code: `import { arr } from "./setup";
        
export default () => {
  let sum = 0;
  arr.forEach(value => sum += value)
}`,

          height: 200,
        },
        {
          description: 'loop through array with reduce',
          code: `import { arr } from "./setup";
        
export default () => {
  let sum = arr.reduce((a,b) => a + b)
}`,
        },
        {
          description: 'loop through array with map',
          code: `import { arr } from "./setup";
        
export default () => {
  let sum = 0;
  arr.map(value => sum += value)
}`,
          height: 200,
        },
      ],
      setup: { code: 'export const arr = new Array(100_000).fill("").map((v,i) => i);', height: 100 },
    }
  })(),
  results: {
    count: undefined,
    bestTotal: undefined,
    values: [],
  },
  modules: [],
  options: {
    amount: 100,
    delayBetween: undefined,
    delayAfter: 50,
  },
  styles: {
    mode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  },
})
let runId = 0
export const actions = {
  addTest: () =>
    setStore('tests', (test) => [
      ...test,
      {
        description: '',
        title: `Test ${test.length}`,
        autoFocus: true,
        code: `import { } from "./setup"

export default () => {

}`,
        height: 200,
      },
    ]),

  runTests: () =>
    when(store.modules)(async (modules) => {
      if (modules.every((v) => !v)) return
      runId++
      const id = runId
      setStore('results', 'count', 0)
      const run = async () => {
        if (id !== runId) throw true
        const results: (Omit<ResultType, 'mean'> | undefined)[] = []
        for (let i = 0; i < modules.length; i++) {
          if (id !== runId) throw true
          const module = modules[i]
          try {
            if (!module || !(typeof module === 'function')) {
              results[i] = undefined
            } else {
              let times: number[] = new Array(store.options.amount)
              let highest = 0
              let lowest = Infinity

              for (let j = 0; j < store.options.amount; j++) {
                if (id !== runId) throw true
                const start = performance.now()
                module()
                const time = performance.now() - start
                if (time > highest) {
                  highest = time
                }
                if (time < lowest) {
                  lowest = time
                }
                times[j] = time
                if (store.options.delayBetween) {
                  await waitFor(store.options.delayBetween)
                }
                setStore('results', 'count', (c) => (c !== undefined ? c + 1 : undefined))
              }
              const total = times?.reduce((a, b) => a + b)

              results[i] = {
                total,
                highest,
                lowest,
                times,
              }
              if (store.options.delayAfter) {
                await waitFor(store.options.delayAfter)
              }
            }
          } catch (err) {
            if (err !== true) console.error(err)
            results[i] = undefined
          }
        }
        return results
      }

      try {
        const values = await run()

        let bestTotal = Infinity
        values.forEach((result) => {
          if (!result) return

          if (result.total < bestTotal) bestTotal = result.total
        })

        if (id !== runId) throw true

        setStore('results', { bestTotal, values, count: undefined })
      } catch (err) {}
    }),
}

export const saveToUrl = () => {
  const json = JSON.stringify({ description: store.description, tests: store.tests, setup: store.setup })
  const state = compress(json)

  console.log('json', json)

  const params = new URLSearchParams(window.location.search)
  params.set('state', state)
  // Now, create the new URL using the current path and the updated query string
  const newUrl = window.location.pathname + '?' + params.toString() + window.location.hash
  // Use the History API to update the URL without reloading the page
  history.pushState({}, '', newUrl)
}
