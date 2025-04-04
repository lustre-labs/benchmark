import gleam/int
import gleam/list
import lustre/effect.{type Effect}

pub type Step {
  NewTodo(text: String)
  SubmitTodo
  CheckTodo(id: Int)
  RemoveFirstTodo
}

pub fn add_complete_delete(num_items: Int) -> List(Step) {
  list.flatten([
    list.flatten(
      initialise(num_items, fn(index) {
        [NewTodo("Item " <> int.to_string(index)), SubmitTodo]
      }),
    ),
    initialise(num_items, CheckTodo),
    list.repeat(RemoveFirstTodo, num_items),
  ])
}

fn initialise(length, initialiser) {
  initialise_loop(length, initialiser, [])
}

fn initialise_loop(length, initialiser, acc) {
  case length > 0 {
    True ->
      initialise_loop(length - 1, initialiser, [initialiser(length), ..acc])
    False -> acc
  }
}

pub fn run(step: Step, msg: msg) -> Effect(msg) {
  use dispatch <- effect.from
  case step {
    NewTodo(value) -> {
      use <- set_value(".new-todo", value)
      dispatch(msg)
    }
    SubmitTodo -> {
      use <- press_enter(".new-todo")
      dispatch(msg)
    }
    CheckTodo(index) -> {
      let selector =
        ".todo-list>:nth-child(" <> int.to_string(index) <> ") .toggle"

      use <- click(selector)
      dispatch(msg)
    }
    RemoveFirstTodo -> {
      use <- click(".todo-list>:first-child .destroy")
      dispatch(msg)
    }
  }
}

@external(javascript, "./step.ffi.mjs", "set_value")
fn set_value(selector: String, value: String, callback: fn() -> a) -> Nil

@external(javascript, "./step.ffi.mjs", "press_enter")
fn press_enter(selector: String, callback: fn() -> a) -> Nil

@external(javascript, "./step.ffi.mjs", "click")
fn click(selector: String, callback: fn() -> a) -> Nil
