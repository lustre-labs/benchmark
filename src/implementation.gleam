import gleam/dynamic/decode
import gleam/string
import instrumentation.{type Measurement}
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/element/keyed
import lustre/event

pub type Implementation {
  Implementation(name: String, version: String, optimised: Bool)
}

pub fn id(implementation: Implementation) {
  let base =
    string.lowercase(implementation.name) <> "-" <> implementation.version
  case implementation.optimised {
    True -> base <> "-optimised"
    False -> base
  }
}

pub fn view_frame(
  implementation: Implementation,
  on_load: msg,
  on_measure: fn(Measurement) -> msg,
) -> Element(msg) {
  let id = id(implementation)
  let url = "/priv/implementations/" <> id <> "/dist/index.html"
  // use a keyed fragment with a single child here to make sure
  // that changing the benchmark always replaces the entire node.
  keyed.fragment([
    #(
      id,
      html.iframe([
        attribute.id("benchmark"),
        attribute.src(url),
        event.on("load", decode.success(on_load)),
        instrumentation.on_measurement(on_measure),
      ]),
    ),
  ])
}

pub fn view_selector(
  implementation: Implementation,
  selected: Bool,
  on_check: fn(Bool) -> msg,
) -> Element(msg) {
  html.label([], [
    html.input([
      attribute.type_("checkbox"),
      attribute.checked(selected),
      event.on_check(on_check),
    ]),
    html.text(" "),
    html.text(to_string(implementation)),
  ])
}

pub fn to_string(implementation: Implementation) -> String {
  let base = implementation.name <> " v" <> implementation.version
  case implementation.optimised {
    True -> base <> " (optimised)"
    False -> base
  }
}
