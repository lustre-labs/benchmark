import gleam/dynamic/decode
import gleam/float
import gleam/list
import humanise
import lustre/attribute.{type Attribute}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

pub type Measurement {
  Sync(elapsed: Float)
  Timeout(elapsed: Float)
  AnimationFrame(elapsed: Float)
  Microtask(elapsed: Float)
  Promise(elapsed: Float)
}

pub type Results {
  Results(
    sync: Float,
    timeout: Float,
    animation_frame: Float,
    microtask: Float,
    promise: Float,
  )
}

pub fn total(results: Results) {
  results.sync
  +. results.timeout
  +. results.animation_frame
  +. results.microtask
  +. results.promise
}

pub fn decoder() -> decode.Decoder(Measurement) {
  use variant <- decode.field("type", decode.string)
  use elapsed <- decode.field("elapsed", decode.float)

  case variant {
    "sync" -> decode.success(Sync(elapsed:))
    "timeout" -> decode.success(Timeout(elapsed:))
    "animation_frame" -> decode.success(AnimationFrame(elapsed:))
    "microtask" -> decode.success(Microtask(elapsed:))
    "promise" -> decode.success(Promise(elapsed:))

    _ -> decode.failure(Sync(0.0), "Measurement")
  }
}

pub fn on_measurement(to_msg: fn(Measurement) -> msg) -> Attribute(msg) {
  let decoder = {
    use measurement <- decode.field("detail", decoder())
    decode.success(to_msg(measurement))
  }

  event.on("lustre-benchmark:measurement", decoder)
}

pub fn to_results(measurements: List(Measurement)) -> Results {
  let initial =
    Results(
      sync: 0.0,
      timeout: 0.0,
      animation_frame: 0.0,
      microtask: 0.0,
      promise: 0.0,
    )

  use results, measurement <- list.fold(measurements, initial)

  case measurement {
    Sync(elapsed) -> Results(..results, sync: results.sync +. elapsed)
    Timeout(elapsed) -> Results(..results, timeout: results.timeout +. elapsed)
    AnimationFrame(elapsed) ->
      Results(..results, animation_frame: results.animation_frame +. elapsed)
    Microtask(elapsed) ->
      Results(..results, microtask: results.microtask +. elapsed)
    Promise(elapsed) -> Results(..results, promise: results.promise +. elapsed)
  }
}

pub fn view(data: List(#(String, Results))) -> Element(msg) {
  let max = {
    use max, #(_, results) <- list.fold(data, 0.0)
    float.max(max, total(results))
  }

  html.div([attribute.id("results")], [
    html.table(
      [
        attribute.class(
          "charts-css column show-labels show-8-secondary-axes data-spacing-10 multiple stacked",
        ),
      ],
      [
        html.tbody([], {
          use #(label, results) <- list.map(data)
          let total = total(results)

          html.tr([], [
            html.th([attribute.attribute("scope", "row")], [html.text(label)]),
            html.td([size(results.promise, max)], []),
            html.td([size(results.microtask, max)], []),
            html.td([size(results.animation_frame, max)], []),
            html.td([size(results.timeout, max)], []),
            html.td([size(results.sync, max)], [
              html.div([attribute.class("data")], [
                html.div([], [
                  html.text("Total: "),
                  html.text(humanise.milliseconds_float(total)),
                ]),
                case results.sync >. 0.0 {
                  True -> time("Sync", results.sync)
                  False -> element.none()
                },
                case results.timeout >. 0.0 {
                  True -> time("Timeout", results.timeout)
                  False -> element.none()
                },
                case results.animation_frame >. 0.0 {
                  True -> time("Animation frame", results.animation_frame)
                  False -> element.none()
                },
                case results.microtask >. 0.0 {
                  True -> time("Microtask", results.microtask)
                  False -> element.none()
                },
                case results.promise >. 0.0 {
                  True -> time("Promise", results.promise)
                  False -> element.none()
                },
              ]),
            ]),
          ])
        }),
      ],
    ),
  ])
}

fn time(label, time) {
  html.div([], [
    html.text(label),
    html.text(": "),
    html.text(humanise.milliseconds_float(time)),
  ])
}

fn size(value, max) {
  attribute.style([#("--size", float.to_string(value /. max))])
}
