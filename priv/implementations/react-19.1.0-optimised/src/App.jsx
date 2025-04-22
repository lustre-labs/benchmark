import { useCallback, useReducer, useMemo } from 'react'
import { useLocation } from "react-router"

import { Header } from './components/Header'
import { Main } from './components/Main'
import { Footer } from './components/Footer'


function App() {
  const { pathname: route } = useLocation()
  const [todos, dispatch] = useReducer(reducer, [])
  const useAction = makeUseAction(dispatch)
  const onAdd = useAction(add)
  const onUpdate = useAction(update)
  const onRemove = useAction(remove)
  const onToggle = useAction(toggle)
  const onClear = useAction(clear)
  const onToggleAll = useAction(toggleAll)
  const onClearCompleted = useAction(clearCompleted)

  const activeCount = useMemo(() => todos.reduce((count, todo) => todo.completed ? count : count + 1, 0))
 
  const visible = useMemo(() => 
    route === '/active'
    ? todos.filter(todo => !todo.completed)
    : route === '/completed'
    ? todos.filter(todo => todo.completed)
    : todos,
    [route, todos])

  return <>
    <Header onAdd={onAdd} />
    <Main todos={visible} onToggleAll={onToggleAll} onUpdate={onUpdate} onToggle={onToggle} onRemove={onRemove} />
    <Footer active={activeCount} total={todos.length} onClearCompleted={onClearCompleted} />
  </>
}

export default App

const makeUseAction = dispatch => ctor => useCallback((...args) => dispatch(ctor(...args)),  [dispatch])

function reducer(state, action) {
  switch (action.type) {
    case add:
      return [...state, { id: nanoid(), title: action.title.trim(), completed: false }]

    case update:
      return state.map(todo => todo.id === action.id ? { ...todo, title: action.title.trim() } : todo)

    case remove:
      return state.filter(todo => todo.id !== action.id)

    case toggle:
      return state.map(todo => todo.id === action.id ? { ...todo, completed: !todo.completed } : todo)

    case clear:
      return []

    case toggleAll:
      return state.map(todo => todo.completed !== action.completed ? { ...todo, completed: action.completed } : todo)

    case clearCompleted:
      return state.filter(todo => !todo.completed)

    default:
      return state
  }
}

export function add(title) {
  return { type: add, title }
}

export function update(id, title) {
  return { type: update, id, title }
}

export function remove(id) {
  return { type: remove, id }
}

export function toggle(id) {
  return { type: toggle, id }
}

export function clear() {
  return { type: clear }
}

export function toggleAll(completed) {
  return { type: toggleAll, completed }
}

export function clearCompleted() {
  return { type: clearCompleted }
}

// This alphabet uses `A-Za-z0-9_-` symbols.
// The order of characters is optimized for better gzip and brotli compression.
// References to the same file (works both for gzip and brotli):
// `'use`, `andom`, and `rict'`
// References to the brotli default dictionary:
// `-26T`, `1983`, `40px`, `75px`, `bush`, `jack`, `mind`, `very`, and `wolf`
const urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

function nanoid(size = 21) {
    let id = "";
    // A compact alternative for `for (var i = 0; i < step; i++)`.
    let i = size;
    while (i--) {
        // `| 0` is more compact and faster than `Math.floor()`.
        id += urlAlphabet[(Math.random() * 64) | 0];
    }
    return id;
}
