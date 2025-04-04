import gleam/dynamic/decode
import gleam/string
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/element/keyed
import lustre/event
import measure.{type Measurement}

pub type Benchmark {
  Benchmark(name: String, version: String, optimised: Bool)
}

pub fn id(benchmark: Benchmark) {
  let base = string.lowercase(benchmark.name) <> "-" <> benchmark.version
  case benchmark.optimised {
    True -> base <> "-optimised"
    False -> base
  }
}

pub fn setup_instrumentation(msg) -> Effect(msg) {
  use dispatch <- effect.from
  do_setup_instrumentation()
  dispatch(msg)
}

@external(javascript, "./benchmark.ffi.mjs", "setup_instrumentation")
fn do_setup_instrumentation() -> Nil

pub fn view_frame(
  benchmark: Benchmark,
  on_load: msg,
  on_measure: fn(Measurement) -> msg,
) -> Element(msg) {
  let id = id(benchmark)
  let url = "/priv/implementations/" <> id <> "/index.html"
  // use a keyed fragment with a single child here to make sure
  // that changing the benchmark always replaces the entire node.
  keyed.fragment([
    #(
      id,
      html.iframe([
        attribute.id("benchmark"),
        attribute.src(url),
        event.on("load", decode.success(on_load)),
        event.on("lustre-benchmark:measurement", {
          use measure <- decode.field("detail", measure.decoder())
          decode.success(on_measure(measure))
        }),
      ]),
    ),
  ])
}

pub fn view_selector(
  benchmark: Benchmark,
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
    html.text(to_string(benchmark)),
  ])
}

pub fn to_string(benchmark: Benchmark) -> String {
  let base = benchmark.name <> " v" <> benchmark.version
  case benchmark.optimised {
    True -> base <> " (optimised)"
    False -> base
  }
}
