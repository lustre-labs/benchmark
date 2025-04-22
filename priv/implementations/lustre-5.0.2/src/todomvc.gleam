import gleam/bool
import gleam/dynamic/decode
import gleam/int
import gleam/string
import iv.{type Array}
import lustre
import lustre/attribute
import lustre/effect
import lustre/element
import lustre/element/html
import lustre/element/keyed
import lustre/event

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, ".todoapp", Nil)
  Nil
}

type Model {
  Model(
    entries: Array(Entry),
    active: Int,
    completed: Int,
    uid: Int,
    visibility: Visibility,
  )
}

type Entry {
  Entry(
    description: String,
    completed: Bool,
    editing: Bool,
    deleted: Bool,
    id: Int,
  )
}

fn new_entry(description, id) {
  Entry(description:, id:, completed: False, editing: False, deleted: False)
}

type Visibility {
  All
  Active
  Completed
}

fn init(_) {
  let model =
    Model(entries: iv.new(), active: 0, completed: 0, visibility: All, uid: 0)

  #(model, effect.none())
}

type Msg {
  UserSubmittedInput(value: String)
  UserClickedClearCompleted
  UserToggledAllCompleted(completed: Bool)
  UserChangedVisibility(visibility: Visibility)
  //
  UserClickedDestroy(index: Int)
  UserToggledCompleted(index: Int, completed: Bool)
  UserToggledEditing(index: Int, editing: Bool)
  UserEditedDescription(index: Int, description: String)
}

fn update(model: Model, msg: Msg) {
  case msg {
    UserSubmittedInput(value) -> {
      let description = string.trim(value)
      use <- bool.guard(when: description == "", return: #(model, effect.none()))

      let entries = iv.append(model.entries, new_entry(description, model.uid))
      let uid = model.uid + 1
      let active = model.active + 1
      let model = Model(..model, uid:, entries:, active:)

      #(model, clear_input("new-todo"))
    }

    UserChangedVisibility(visibility) -> {
      #(Model(..model, visibility:), effect.none())
    }

    UserToggledAllCompleted(completed) -> {
      let entries =
        iv.map(model.entries, fn(entry) { Entry(..entry, completed:) })

      let total = model.completed + model.active
      let model = case completed {
        True -> Model(..model, entries:, completed: total, active: 0)
        False -> Model(..model, entries:, active: total, completed: 0)
      }

      #(model, effect.none())
    }

    UserClickedClearCompleted -> {
      let entries = {
        use entry <- iv.map(model.entries)
        case entry {
          Entry(completed: True, ..) -> Entry(..entry, deleted: True)
          _ -> entry
        }
      }

      #(Model(..model, entries:, completed: 0), effect.none())
    }

    UserClickedDestroy(index) -> {
      case iv.get(model.entries, index) {
        Ok(entry) if !entry.deleted -> {
          let entries =
            iv.try_set(model.entries, index, Entry(..entry, deleted: True))

          let model = case entry.completed {
            True -> Model(..model, entries:, completed: model.completed - 1)
            False -> Model(..model, entries:, active: model.active - 1)
          }

          #(model, effect.none())
        }
        _ -> #(model, effect.none())
      }
    }

    UserToggledCompleted(index:, completed:) ->
      case iv.get(model.entries, index) {
        Ok(entry) if entry.completed != completed -> {
          let entries =
            iv.try_set(model.entries, index, Entry(..entry, completed:))

          let model = case completed {
            True -> {
              let active = model.active - 1
              let completed = model.completed + 1
              Model(..model, entries:, active:, completed:)
            }
            False -> {
              let active = model.active + 1
              let completed = model.completed - 1
              Model(..model, entries:, active:, completed:)
            }
          }

          #(model, effect.none())
        }
        _ -> #(model, effect.none())
      }

    UserToggledEditing(index:, editing: True) -> {
      let entries =
        iv.try_update(model.entries, index, fn(entry) {
          Entry(..entry, editing: True)
        })

      #(Model(..model, entries:), effect.none())
    }
    UserToggledEditing(index:, editing: False) -> {
      let entries =
        iv.try_update(model.entries, index, fn(entry) {
          let description = string.trim(entry.description)
          Entry(..entry, editing: False, description:)
        })

      #(Model(..model, entries:), effect.none())
    }

    UserEditedDescription(index:, description:) -> {
      let entries =
        iv.try_update(model.entries, index, fn(entry) {
          Entry(..entry, description:)
        })

      #(Model(..model, entries:), effect.none())
    }
  }
}

// -- VIEW ---------------------------------------------------------------------

fn view(model: Model) {
  let total = model.active + model.completed
  element.fragment([
    view_input(),
    view_entries(model),
    html.footer([attribute.class("footer"), hidden(total <= 0)], [
      view_active_count(model.active),
      view_filters(model.visibility),
      view_completed_count(model.completed),
    ]),
  ])
}

fn view_input() {
  html.header([attribute.class("header")], [
    html.h1([], [html.text("todos")]),
    html.input([
      attribute.id("new-todo"),
      attribute.class("new-todo"),
      attribute.placeholder("What needs to be done?"),
      attribute.autofocus(True),
      on_enter(UserSubmittedInput),
    ]),
  ])
}

fn view_entries(model: Model) {
  let total = model.active + model.completed
  html.section([attribute.class("main"), hidden(total <= 0)], [
    html.input([
      attribute.id("toggle-all"),
      attribute.class("toggle-all"),
      attribute.type_("checkbox"),
      attribute.checked(model.active <= 0),
      event.on_check(UserToggledAllCompleted),
    ]),
    html.label([attribute.for("toggle-all")], [
      html.text("Mark all as complete"),
    ]),
    keyed.ul([attribute.class("todo-list")], {
      use list, entry <- iv.fold_right(model.entries, [])
      let is_visible = case model.visibility {
        Completed -> entry.completed && !entry.deleted
        Active -> !entry.completed && !entry.deleted
        _ -> !entry.deleted
      }
      case is_visible {
        True -> [#(int.to_string(entry.id), view_entry(entry)), ..list]
        False -> list
      }
    }),
  ])
}

fn view_entry(entry: Entry) {
  let Entry(description:, id:, completed:, editing:, ..) = entry
  html.li(
    [attribute.classes([#("completed", completed), #("editing", editing)])],
    [
      case entry.editing {
        False ->
          html.div([attribute.class("view")], [
            html.input([
              attribute.class("toggle"),
              attribute.type_("checkbox"),
              attribute.checked(completed),
              event.on_check(UserToggledCompleted(id, _)),
            ]),
            html.label([on_double_click(UserToggledEditing(id, True))], [
              html.text(description),
            ]),
            html.button(
              [
                attribute.class("destroy"),
                event.on_click(UserClickedDestroy(id)),
              ],
              [],
            ),
          ])
        True ->
          html.input([
            attribute.class("edit"),
            attribute.value(description),
            attribute.autofocus(True),
            event.on_input(UserEditedDescription(id, _)),
            event.on_blur(UserToggledEditing(id, False)),
            on_enter(fn(_) { UserToggledEditing(id, False) }),
          ])
      },
    ],
  )
}

fn view_active_count(entries_left) {
  let item = case entries_left {
    1 -> "item"
    _ -> "items"
  }

  html.span([attribute.class("todo-count")], [
    html.strong([], [html.text(int.to_string(entries_left))]),
    html.text(" "),
    html.text(item),
    html.text(" left"),
  ])
}

fn view_filters(visibility) {
  html.ul([attribute.class("filters")], [
    visibility_control("#/", All, visibility),
    visibility_control("#/active", Active, visibility),
    visibility_control("#/completed", Completed, visibility),
  ])
}

fn visibility_control(url, visibility, actual_visibility) {
  html.li([event.on_click(UserChangedVisibility(visibility))], [
    html.a(
      [
        attribute.href(url),
        attribute.classes([#("selected", visibility == actual_visibility)]),
      ],
      [
        case visibility {
          All -> html.text("All")
          Active -> html.text("Active")
          Completed -> html.text("Completed")
        },
      ],
    ),
  ])
}

fn view_completed_count(entries_completed) {
  html.button(
    [
      attribute.class("clear-completed"),
      hidden(entries_completed == 0),
      event.on_click(UserClickedClearCompleted),
    ],
    [
      html.text("Clear completed ("),
      html.text(int.to_string(entries_completed)),
      html.text(")"),
    ],
  )
}

fn hidden(hidden) {
  case hidden {
    True -> attribute.style("display", "none")
    False -> attribute.none()
  }
}

// -- EFFECTS & EVENT HANDLERS -------------------------------------------------

fn on_enter(to_msg) {
  event.on("keydown", {
    use code <- decode.field("keyCode", decode.int)
    use value <- decode.subfield(["target", "value"], decode.string)
    case code {
      13 -> decode.success(to_msg(value))
      _ -> decode.failure(to_msg(value), "not enter")
    }
  })
}

fn on_double_click(msg) {
  event.on("dblclick", decode.success(msg))
}

fn clear_input(id) {
  use _ <- effect.from
  do_clear(id)
}

@external(javascript, "./todomvc.ffi.mjs", "clear")
fn do_clear(id: String) -> Nil
