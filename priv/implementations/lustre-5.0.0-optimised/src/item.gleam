import gleam/dynamic/decode
import gleam/json
import gleam/string
import lustre
import lustre/attribute
import lustre/component
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

const node = "todomvc-item"

const change_event = "change"

const delete_event = "delete"

pub fn register() {
  let component =
    lustre.component(init, update, view, [
      component.open_shadow_root(True),
      component.adopt_styles(False),
      component.on_attribute_change("title", fn(title) {
        Ok(ParentChangedTitle(title))
      }),
      component.on_attribute_change("completed", fn(completed) {
        case completed {
          "yes" -> Ok(ParentToggledCompleted(True))
          "no" -> Ok(ParentToggledCompleted(False))
          _ -> Error(Nil)
        }
      }),
    ])
  lustre.register(component, node)
}

pub fn item(
  title: String,
  completed: Bool,
  on_change: fn(String, Bool) -> msg,
  on_delete: msg,
) {
  element.element(
    node,
    [
      attribute.attribute("title", title),
      attribute.attribute("completed", case completed {
        True -> "yes"
        False -> "no"
      }),
      event.on(change_event, {
        use title <- decode.subfield(["detail", "title"], decode.string)
        use completed <- decode.subfield(["detail", "completed"], decode.bool)
        decode.success(on_change(title, completed))
      }),
      event.on(delete_event, decode.success(on_delete)),
    ],
    [],
  )
}

type Model {
  Model(title: String, completed: Bool, editing: Bool)
}

fn init(_) {
  let model = Model(title: "", completed: False, editing: False)
  #(model, effect.none())
}

type Msg {
  ParentChangedTitle(title: String)
  ParentToggledCompleted(completed: Bool)
  //
  UserToggledEditing(editing: Bool)
  UserChangedTitle(title: String)
  UserToggledCompleted(completed: Bool)
  UserClickedDestroy
  UserSubmittedChanges
}

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    ParentChangedTitle(title) | UserChangedTitle(title) -> {
      #(Model(..model, title:), effect.none())
    }
    ParentToggledCompleted(completed) -> {
      #(Model(..model, completed:), effect.none())
    }
    UserToggledEditing(editing) -> {
      #(Model(..model, editing:), effect.none())
    }
    UserToggledCompleted(completed) -> {
      let model = Model(..model, completed:)
      #(model, emit_change(model))
    }
    UserSubmittedChanges -> {
      let model =
        Model(..model, title: string.trim(model.title), editing: False)
      #(model, emit_change(model))
    }
    UserClickedDestroy -> {
      #(model, event.emit(delete_event, json.null()))
    }
  }
}

fn emit_change(model: Model) -> Effect(msg) {
  event.emit(
    change_event,
    json.object([
      #("title", json.string(model.title)),
      #("completed", json.bool(model.completed)),
    ]),
  )
}

fn view(model: Model) -> Element(Msg) {
  html.li(
    [
      attribute.classes([
        #("completed", model.completed),
        #("editing", model.editing),
      ]),
    ],
    [
      case model.editing {
        False ->
          html.div([attribute.class("view")], [
            html.input([
              attribute.class("toggle"),
              attribute.type_("checkbox"),
              attribute.checked(model.completed),
              event.on_check(UserToggledCompleted),
            ]),
            html.label([on_double_click(UserToggledEditing(True))], [
              html.text(model.title),
            ]),
            html.button(
              [attribute.class("destroy"), event.on_click(UserClickedDestroy)],
              [],
            ),
          ])
        True ->
          html.input([
            attribute.class("edit"),
            attribute.value(model.title),
            attribute.autofocus(True),
            event.on_input(UserChangedTitle),
            event.on_blur(UserSubmittedChanges),
            on_enter(UserSubmittedChanges),
          ])
      },
    ],
  )
}

fn on_enter(msg) {
  event.on("keydown", {
    use code <- decode.field("keyCode", decode.int)
    case code {
      13 -> decode.success(msg)
      _ -> decode.failure(msg, "not enter")
    }
  })
}

fn on_double_click(msg) {
  event.on("dblclick", decode.success(msg))
}
