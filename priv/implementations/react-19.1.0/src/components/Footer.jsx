import { NavLink } from 'react-router'
import { clearCompleted, useTodoContext } from "../TodoContext"

export function Footer() {
  const { todos, dispatch } = useTodoContext()

  if (todos.length === 0) {
    return null
  }

  const activeTodos = todos.reduce((count, todo) => todo.completed ? count : count + 1, 0)

  const onClearCompleted = () => {
    dispatch(clearCompleted())
  }
  
  return (
    <footer className="footer">
      <span className="todo-count">
        {`${activeTodos} ${activeTodos === 1 ? 'item' : 'items'} left`}
      </span>
      <ul className="filters">
        <li>
          <NavLink to="/" end className={({ isActive }) => isActive && 'selected'}>
            All
          </NavLink>
        </li>
        <li>
          <NavLink to="/active" end className={({ isActive }) => isActive && 'selected'}>
            Active
          </NavLink>
        </li>
        <li>
          <NavLink to="/completed" end className={({ isActive }) => isActive && 'selected'}>
            Completed
          </NavLink>
        </li>
      </ul>
      <button className="clear-completed" disabled={activeTodos === todos.length} onClick={onClearCompleted}>
        Clear completed
      </button>
    </footer>
  )
}
