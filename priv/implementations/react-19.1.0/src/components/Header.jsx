import { useLayoutEffect, useRef, useState } from 'react'
import { useTodoContext, add } from '../TodoContext'

export function Header() {
  const { dispatch } = useTodoContext()
  const [input, setInput] = useState('')
  const inputEl = useRef(null)

  const onInput = e => {
    setInput(e.target.value)
  }

  const onKeyDown = e => {
    if (e.key !== 'Enter') {
      return
    }

    dispatch(add(input))
    setInput('')
  }

  useLayoutEffect(() => inputEl.current.focus(), [])

  return (
    <header className="header">
      <h1>todos</h1>
      <input
        className="new-todo"
        placeholder="What needs to be done?"
        autofocus
        ref={inputEl}
        value={input}
        onInput={onInput}
        onKeyDown={onKeyDown}
      />
    </header>
  )
}
