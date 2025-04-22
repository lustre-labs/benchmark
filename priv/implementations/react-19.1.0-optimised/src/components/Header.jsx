import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react'

export const Header = memo(function Header({ onAdd }) {
  const inputEl = useRef(null)

  const onKeyDown = useCallback(e => {
    if (e.key !== 'Enter') {
      return
    }

    onAdd(e.target.value)
    e.target.value = ''
  }, [onAdd])

  useLayoutEffect(() => inputEl.current.focus(), [])

  return (
    <header className="header">
      <h1>todos</h1>
      <input
        className="new-todo"
        placeholder="What needs to be done?"
        autofocus
        ref={inputEl}
        onKeyDown={onKeyDown}
      />
    </header>
  )
})
