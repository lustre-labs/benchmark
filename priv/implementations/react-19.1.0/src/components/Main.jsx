import { useLocation } from "react-router";
import { toggleAll, useTodoContext } from "../TodoContext";
import { Item } from './Item'

 export function Main() {
   const { pathname: route } = useLocation()
   const { todos, dispatch } = useTodoContext()

  const visibleTodos =
    route === '/active'
    ? todos.filter(todo => !todo.completed)
    : route === '/completed'
    ? todos.filter(todo => todo.completed)
    : todos;

  if (visibleTodos.length === 0) {
    return null;
  }

   const onToggleAll = (e) => {
     dispatch(toggleAll(e.target.checked))
   }

  return (
    <section className="main">
      <input
        type="checkbox"
        className="toggle-all"
        id="toggle-all"
        checked={visibleTodos.every(todo => todo.completed)}
        onChange={onToggleAll}
      />
      <label for="toggle-all">
        Mark all as complete
      </label>

      <ul className="todo-list">
        {visibleTodos.map((todo) => <Item todo={todo} key={todo.id} />)}
      </ul>
    </section>
  )
 }
