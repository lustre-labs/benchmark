import { createSignal, createMemo, onCleanup, batch, Show, For } from "solid-js";
import { render } from "solid-js/web";

// Optimised TodoMVC for the lustre-labs benchmark.
//
// Differences from the stock implementation (../solid-1.9.5):
//  - Todos are plain objects holding per-item signals (title, completed) in an
//    immutable array behind one signal, instead of a deep store proxy. Toggling
//    a todo writes one signal and touches nothing else; the list is not diffed.
//  - The "items left" count is a counter maintained in the handlers (O(1))
//    instead of a memo that re-filters the whole list after every change.
//  - Per-row handlers receive the todo object directly, so updates never scan
//    the list to find the row by id.

const ESCAPE_KEY = 27;
const ENTER_KEY = 13;
const setFocus = (el) => setTimeout(() => el.focus());

let nextId = 1;
const createTodo = (initialTitle) => {
  const [title, setTitle] = createSignal(initialTitle);
  const [completed, setCompleted] = createSignal(false);
  return { id: nextId++, title, setTitle, completed, setCompleted };
};

const TodoApp = () => {
  const [todos, setTodos] = createSignal([]);
  const [remaining, setRemaining] = createSignal(0);
  const [showMode, setShowMode] = createSignal(location.hash.slice(2) || "all");
  const [editingId, setEditingId] = createSignal(undefined);

  // In "all" mode this returns the array as-is and only depends on the array
  // signal, so toggling a todo does not re-run it.
  const filtered = createMemo(() => {
    const mode = showMode();
    const list = todos();
    if (mode === "active") return list.filter((todo) => !todo.completed());
    if (mode === "completed") return list.filter((todo) => todo.completed());
    return list;
  });

  const addTodo = ({ target, keyCode }) => {
    const title = target.value.trim();
    if (keyCode === ENTER_KEY && title) {
      const todo = createTodo(title);
      batch(() => {
        setTodos((list) => [todo, ...list]);
        setRemaining((count) => count + 1);
      });
      target.value = "";
    }
  };

  const removeTodo = (todo) =>
    batch(() => {
      setTodos((list) => list.filter((item) => item !== todo));
      if (!todo.completed()) setRemaining((count) => count - 1);
    });

  const toggle = (todo, { target: { checked } }) =>
    batch(() => {
      if (todo.completed() === checked) return;
      todo.setCompleted(checked);
      setRemaining((count) => count + (checked ? -1 : 1));
    });

  const toggleAll = (completed) =>
    batch(() => {
      const list = todos();
      for (const todo of list) todo.setCompleted(completed);
      setRemaining(completed ? 0 : list.length);
    });

  const clearCompleted = () => setTodos((list) => list.filter((todo) => !todo.completed()));

  const save = (todo, { target: { value } }) => {
    const title = value.trim();
    if (editingId() === todo.id && title) {
      todo.setTitle(title);
      setEditingId(undefined);
    }
  };

  const doneEditing = (todo, e) => {
    if (e.keyCode === ENTER_KEY) save(todo, e);
    else if (e.keyCode === ESCAPE_KEY) setEditingId(undefined);
  };

  const locationHandler = () => setShowMode(location.hash.slice(2) || "all");
  window.addEventListener("hashchange", locationHandler);
  onCleanup(() => window.removeEventListener("hashchange", locationHandler));

  return (
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <input class="new-todo" placeholder="What needs to be done?" onKeyDown={addTodo} />
      </header>
      <Show when={todos().length > 0}>
        <section class="main">
          <input
            id="toggle-all"
            class="toggle-all"
            type="checkbox"
            checked={!remaining()}
            onInput={({ target: { checked } }) => toggleAll(checked)}
          />
          <label for="toggle-all" />
          <ul class="todo-list">
            <For each={filtered()}>
              {(todo) => (
                <li
                  class="todo"
                  classList={{ editing: editingId() === todo.id, completed: todo.completed() }}
                >
                  <div class="view">
                    <input class="toggle" type="checkbox" checked={todo.completed()} onInput={[toggle, todo]} />
                    <label onDblClick={[setEditingId, todo.id]}>{todo.title()}</label>
                    <button class="destroy" onClick={[removeTodo, todo]} />
                  </div>
                  <Show when={editingId() === todo.id}>
                    <input
                      class="edit"
                      value={todo.title()}
                      onFocusOut={[save, todo]}
                      onKeyUp={[doneEditing, todo]}
                      use:setFocus
                    />
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </section>

        <footer class="footer">
          <span class="todo-count">
            <strong>{remaining()}</strong>{" "}
            {remaining() === 1 ? " item " : " items "} left
          </span>
          <ul class="filters">
            <li><a href="#/" classList={{ selected: showMode() === "all" }}>All</a></li>
            <li><a href="#/active" classList={{ selected: showMode() === "active" }}>Active</a></li>
            <li><a href="#/completed" classList={{ selected: showMode() === "completed" }}>Completed</a></li>
          </ul>
          <Show when={remaining() !== todos().length}>
            <button class="clear-completed" onClick={clearCompleted}>
              Clear completed
            </button>
          </Show>
        </footer>
      </Show>
    </section>
  );
};

render(TodoApp, document.getElementById("main"));
