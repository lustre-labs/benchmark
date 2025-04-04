import gleam/dynamic/decode
import gleam/float
import gleam/list
import humanise
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub type Measurement {
  Sync(elapsed: Float)
  Async(elapsed: Float)
}

pub type Results {
  Results(sync: Float, async: Float)
}

pub fn decoder() -> decode.Decoder(Measurement) {
  use variant <- decode.field("type", decode.string)
  case variant {
    "sync" -> {
      use elapsed <- decode.field("elapsed", decode.float)
      decode.success(Sync(elapsed:))
    }
    "async" -> {
      use elapsed <- decode.field("elapsed", decode.float)
      decode.success(Async(elapsed:))
    }
    _ -> decode.failure(Sync(0.0), "Measurement")
  }
}

pub fn to_results(measurements: List(Measurement)) -> Results {
  let initial = Results(sync: 0.0, async: 0.0)
  use results, measurement <- list.fold(measurements, initial)
  case measurement {
    Async(async) -> Results(sync: results.sync, async: results.async +. async)
    Sync(sync) -> Results(sync: results.sync +. sync, async: results.async)
  }
}

pub fn view(data: List(#(String, Results))) -> Element(msg) {
  let max = {
    use max, #(_, results) <- list.fold(data, 0.0)
    float.max(max, results.sync +. results.async)
  }

  html.div([attribute.id("results")], [
    html.table(
      [
        attribute.class(
          "charts-css columns show-labels show-8-secondary-axes data-spacing-10",
        ),
      ],
      {
        use #(label, results) <- list.map(data)
        let size = { results.sync +. results.async } /. max
        html.tr([], [
          html.th([attribute.attribute("scope", "row")], [html.text(label)]),
          html.td([attribute.style([#("--size", float.to_string(size))])], [
            html.span([attribute.class("data")], [
              html.text("Sync: "),
              html.text(humanise.milliseconds_float(results.sync)),
              html.br([]),
              html.text("Async: "),
              html.text(humanise.milliseconds_float(results.async)),
            ]),
          ]),
        ])
      },
    ),
  ])
}
