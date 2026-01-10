<script>
  // State manager using Svelte 5's new reactive primitives
  let todos = $state.raw([]);
  let filter = $state('all');
  let editing = $state(null);
  let newTodo = $state('');
  
  // Number of active todos
  let activeTodoCount = $derived.by(() => {
    return todos.filter(todo => !todo.completed).length;
  });
  
  // Are all todos completed?
  let allCompleted = $derived.by(() => {
    return todos.length > 0 && activeTodoCount === 0;
  });
  
  // Add a new todo
  function addTodo(e) {
    if (e.key === 'Enter' || e.type === 'click') {
      const text = newTodo.trim();
      if (text) {
        todos = [...todos, {
          id: Date.now(),
          text,
          completed: false
        }];
        
        newTodo = '';
      }
    }
  }
  
  // Remove a todo
  function removeTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
  }
  
  // Toggle todo completed status
  function toggleTodo(id) {
    todos = todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo);
  }
  
  // Toggle all todos completed status
  function toggleAll() {
    const targetStatus = !allCompleted;
    todos = todos.map(todo => todo.completed !== targetStatus ? { ...todo, completed: targetStatus } : todo);
  }
  
  // Clear all completed todos
  function clearCompleted() {
    todos = todos.filter(todo => !todo.completed);
  }
  
  // Start editing a todo
  function startEditing(id) {
    editing = id;
  }
  
  // Save edited todo
  function saveTodo(id, e) {
    const text = e.target.value.trim();
    if (e.key === 'Enter' || e.type === 'blur') {
      if (text) {
        todos = todos.map(todo => todo.id === id ? { ...todo, text: text } : todo);
      } else {
        removeTodo(id);
      }
      editing = null;
    }
  }
</script>

<section class="todoapp">
  <header class="header">
    <h1>todos</h1>
    <input 
      class="new-todo" 
      placeholder="What needs to be done?" 
      bind:value={newTodo} 
      onkeydown={addTodo}
      autofocus
    />
  </header>
  
  {#if todos.length > 0}
    <section class="main">
      <input 
        id="toggle-all" 
        class="toggle-all" 
        type="checkbox" 
        checked={allCompleted}
        onchange={toggleAll}
      />
      <label for="toggle-all">Mark all as complete</label>
      
      <ul class="todo-list">
        {#each todos as todo (todo.id)}
        {#if filter === 'all' || (filter === 'active' && !todo.completed) || (filter === 'completed' && todo.completed)}
          <li class:completed={todo.completed} class:editing={editing === todo.id}>
            <div class="view">
              <input 
                class="toggle" 
                type="checkbox" 
                checked={todo.completed}
                onchange={() => toggleTodo(todo.id)}
              />
              <label ondblclick={() => startEditing(todo.id)}>{todo.text}</label>
              <button class="destroy" onclick={() => removeTodo(todo.id)}></button>
            </div>
            {#if editing === todo.id}
              <input 
                class="edit" 
                value={todo.text}
                onblur={(e) => saveTodo(todo.id, e)}
                onkeydown={(e) => saveTodo(todo.id, e)}
                use:focusElement
              />
            {/if}
          </li>
          {/if}
        {/each}
      </ul>
    </section>
    
    <footer class="footer">
      <span class="todo-count">
        <strong>{activeTodoCount}</strong> {activeTodoCount === 1 ? 'item' : 'items'} left
      </span>
      
      <ul class="filters">
        <li><a class:selected={filter === 'all'} href="#/" onclick={() => filter = 'all'}>All</a></li>
        <li><a class:selected={filter === 'active'} href="#/active" onclick={() => filter = 'active'}>Active</a></li>
        <li><a class:selected={filter === 'completed'} href="#/completed" onclick={() => filter = 'completed'}>Completed</a></li>
      </ul>
      
      {#if todos.length > activeTodoCount}
        <button class="clear-completed" onclick={clearCompleted}>
          Clear completed
        </button>
      {/if}
    </footer>
  {/if}
</section>

<script module>
  // Custom directive to auto-focus the edit input
  function focusElement(node) {
    node.focus();
    return {
      destroy() {}
    };
  }
</script>
