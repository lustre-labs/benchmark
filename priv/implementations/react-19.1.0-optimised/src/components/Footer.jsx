import {  memo } from 'react'
import { NavLink } from 'react-router'

export const Footer = memo(function Footer({ active, total, onClearCompleted }) {
  if (total === 0) {
    return null
  }

  return (
    <footer className="footer">
      <span className="todo-count">
        {`${active} ${active === 1 ? 'item' : 'items'} left`}
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
      <button className="clear-completed" disabled={active === total} onClick={onClearCompleted}>
        Clear completed
      </button>
    </footer>
  )
})
