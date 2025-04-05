import { createContext, use, useReducer } from 'react'

const TodoContext = createContext({
  todos: [],
  dispatch: () => {}
})

export function useTodoContext() {
  return use(TodoContext)
}

function TodoContextProvider({ children }) {
  const [todos, dispatch] = useReducer(reducer, [])
  return <TodoContext.Provider value={{ todos, dispatch }}>
    {children}
  </TodoContext.Provider>
}

export {
  TodoContextProvider as TodoContext
}

function reducer(state, action) {
  switch (action.type) {
    case 'add':
      return [...state, { id: nanoid(), title: action.title.trim(), completed: false }]

    case 'update':
      return state.map(todo => todo.id === action.id ? { ...todo, title: action.title.trim() } : todo)

    case 'remove':
      return state.filter(todo => todo.id !== action.id)

    case 'toggle':
      return state.map(todo => todo.id === action.id ? { ...todo, completed: !todo.completed } : todo)

    case 'clear':
      return []

    case 'toggle-all':
      return state.map(todo => todo.completed !== action.completed ? { ...todo, completed: action.completed } : todo)

    case 'clear-completed':
      return state.filter(todo => !todo.completed)

    default:
      return state
  }
}

export function add(title) {
  return { type: 'add', title }
}

export function update(id, title) {
  return { type: 'update', id, title }
}

export function remove(id) {
  return { type: 'remove', id }
}

export function toggle(id) {
  return { type: 'toggle', id }
}

export function clear() {
  return { type: 'clear' }
}

export function toggleAll(completed) {
  return { type: 'toggle-all', completed }
}

export function clearCompleted() {
  return { type: 'clear-completed' }
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
