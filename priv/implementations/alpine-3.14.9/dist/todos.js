window.todos = function () {
    return {
        filter: 'all',
        newTodo: '',
        editedTodo: null,
        todos: [],

        get active() {
            return this.todos.filter((todo) => !todo.completed);
        },

        get completed() {
            return this.todos.filter((todo) => todo.completed);
        },

        get filteredTodos() {
            return {
                all: this.todos,
                active: this.active,
                completed: this.completed
            }[this.filter];
        },

        get allComplete() {
            return this.todos.length === this.completed.length;
        },

        addTodo() {
            if (!this.newTodo) return;

            this.todos.push({
                id: Date.now(),
                body: this.newTodo,
                completed: false,
            });

            this.newTodo = '';
        },

        editTodo(todo) {
            todo.cachedBody = todo.body;

            this.editedTodo = todo;
        },

        cancelEdit(todo) {
            todo.body = todo.cachedBody;

            this.editedTodo = null;

            delete todo.cachedBody;
        },

        editComplete(todo) {
            if (todo.body.trim() === '') {
                return this.deleteTodo(todo);
            }

            this.editedTodo = null;

        },

        deleteTodo(todo) {
            let position = this.todos.indexOf(todo);

            this.todos.splice(position, 1);

        },

        toggleTodoCompletion(todo) {
            todo.completed = !todo.completed;

        },

        toggleAllComplete() {
            let allComplete = this.allComplete;

            this.todos.forEach((todo) => (todo.completed = !allComplete));

        },

        clearCompletedTodos() {
            this.todos = this.active;

        },
    };
};
