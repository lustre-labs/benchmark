import { Item } from './Item'

 export const Main = function Main({ todos, onToggleAll, onUpdate, onToggle, onRemove }) {

  if (todos.length === 0) {
    return null;
  }

  return (
    <section className="main">
      <input
        type="checkbox"
        className="toggle-all"
        id="toggle-all"
        checked={todos.every(todo => todo.completed)}
        onChange={onToggleAll}
      />
      <label for="toggle-all">
        Mark all as complete
      </label>

      <ul className="todo-list">
        {todos.map((todo) => <Item
          todo={todo}
          key={todo.id}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />)}
      </ul>
    </section>
  )
 }
