import { memo, useCallback, useState } from 'react'

export const Item = memo(function Item({ todo, onToggle, onRemove, onUpdate }) {
  const [editing, setEditing] = useState(false)

  const onChange = () => {
    onToggle(todo.id)
  }

  const onBlur = (e) => {
    setEditing(false)
    onUpdate(todo.id, e.target.value)
  }

  const onKeyDown = (e) => {
    if (e.key !== 'Enter') {
      return
    }

    onUpdate(todo.id, e.target.value)
  }

  const onDblClick = () => {
    setEditing(true)
  }

  const onDestroy = () => {
    onRemove(todo.id)
  }

  return (
    <li className={[editing ? 'editing' : '', todo.completed ? 'completed' : ''].join(' ')}>
      {editing
        ? <input
            type="text"
            className="edit"
            id={`todo-${todo.id}`}
            defaultValue={todo.title}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
          />
        : <div className="view">
            <input
              type="checkbox"
              className="toggle"
              checked={todo.completed}
              onChange={onChange}
            />
            <label onDoubleClick={onDblClick}>
              {todo.title}
            </label>
            <button className="destroy" onClick={onDestroy} />
          </div>
      }
    </li>
  )
})
