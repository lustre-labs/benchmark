import { useState } from 'react'
import { remove, toggle, update, useTodoContext } from "../TodoContext";

export function Item({ todo }) {
  const { dispatch } = useTodoContext()
  const [editing, setEditing] = useState(false)

  const onToggle = () => {
    dispatch(toggle(todo.id))
  }

  const onBlur = (e) => {
    setEditing(false)
    dispatch(update(todo.id, e.target.value))
  }

  const onKeyDown = (e) => {
    if (e.key !== 'Enter') {
      return
    }

    dispatch(update(todo.id, e.target.value))
  }

  const onDblClick = () => {
    setEditing(true)
  }

  const onDestroy = () => {
    dispatch(remove(todo.id))
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
              onChange={onToggle}
            />
            <label onDoubleClick={onDblClick}>
              {todo.title}
            </label>
            <button className="destroy" onClick={onDestroy} />
          </div>
      }
    </li>
  )
}
