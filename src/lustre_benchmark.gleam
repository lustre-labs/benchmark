import gleam/dynamic/decode
import gleam/int
import gleam/list
import gleam/pair
import gleam/set.{type Set}
import implementation.{type Implementation}
import instrumentation.{type Measurement, type Results}
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import step.{type Step}

pub fn main() {
  let assert Ok(implementations) =
    get_implementations() |> decode.run(decode.list(implementation.decoder()))

  let app = lustre.application(init, update, view)

  let assert Ok(_) = lustre.start(app, "body", implementations)
  Nil
}

@external(javascript, "./app.ffi.mjs", "get_implementations")
fn get_implementations() -> decode.Dynamic

type Model {
  Model(
    implementations: List(Implementation),
    selected: Set(Implementation),
    num_items: Int,
    runner: Runner,
  )
}

type Runner {
  NotRunYet
  Finished(results: List(#(Implementation, Results)))
  Loading(
    current_implementation: Implementation,
    implementations: List(Implementation),
    measurements: List(#(Implementation, List(Measurement))),
  )
  Running(
    current_implementation: Implementation,
    current_measurements: List(Measurement),
    implementations: List(Implementation),
    measurements: List(#(Implementation, List(Measurement))),
    steps: List(Step),
  )
  Unloading(
    current_implementation: Implementation,
    current_measurements: List(Measurement),
    implementations: List(Implementation),
    measurements: List(#(Implementation, List(Measurement))),
    can_unload: Bool,
  )
}

fn is_running(model: Model) -> Bool {
  case model.runner {
    Running(..) -> True
    _ -> False
  }
}

fn init(implementations) -> #(Model, Effect(Msg)) {
  let model =
    Model(
      implementations:,
      selected: set.new(),
      num_items: 100,
      runner: NotRunYet,
    )
  #(model, effect.none())
}

type Msg {
  UserToggledImplementation(Implementation, Bool)
  UserChangedNumItems(num_items: Int)
  UserClickedStart
  //
  ImplementationLoaded
  ImplementationRendered
  StepExecuted
  MeasurementReceived(Measurement)
  TryUnload
}

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    UserToggledImplementation(implementation, True) -> {
      let model =
        Model(..model, selected: set.insert(model.selected, implementation))
      #(model, effect.none())
    }
    UserToggledImplementation(implementation, False) -> {
      let model =
        Model(..model, selected: set.delete(model.selected, implementation))
      #(model, effect.none())
    }
    UserChangedNumItems(num_items) -> {
      #(Model(..model, num_items:), effect.none())
    }
    UserClickedStart -> {
      let selected =
        model.implementations
        |> list.filter(set.contains(model.selected, _))

      let runner = case selected {
        [] -> model.runner
        [current_implementation, ..implementations] ->
          Loading(current_implementation:, implementations:, measurements: [])
      }

      #(Model(..model, runner:), effect.none())
    }

    MeasurementReceived(measurement) ->
      case model.runner {
        Running(current_measurements:, ..) as runner -> {
          let current_measurements = [measurement, ..current_measurements]
          let runner = Running(..runner, current_measurements:)
          #(Model(..model, runner:), effect.none())
        }
        Unloading(current_measurements:, ..) as runner -> {
          let current_measurements = [measurement, ..current_measurements]
          let runner =
            Unloading(..runner, current_measurements:, can_unload: False)
          #(Model(..model, runner:), effect.none())
        }
        _ -> #(model, effect.none())
      }

    ImplementationLoaded -> {
      #(model, step.wait_for_element(".new-todo", ImplementationRendered))
    }

    ImplementationRendered ->
      case model.runner {
        Loading(current_implementation:, implementations:, measurements:) -> {
          let #(runner, effects) =
            step(Running(
              current_implementation:,
              current_measurements: [],
              implementations:,
              measurements:,
              steps: step.add_complete_delete(model.num_items),
            ))

          #(Model(..model, runner:), effects)
        }

        _ -> #(model, effect.none())
      }

    StepExecuted -> {
      let #(runner, effects) = step(model.runner)
      #(Model(..model, runner:), effects)
    }

    TryUnload ->
      case model.runner {
        Unloading(
          can_unload: True,
          current_implementation:,
          implementations: [next_implementation, ..implementations],
          measurements:,
          current_measurements:,
        ) -> {
          let runner =
            Loading(
              current_implementation: next_implementation,
              implementations:,
              measurements: [
                #(current_implementation, current_measurements),
                ..measurements
              ],
            )

          #(Model(..model, runner:), effect.none())
        }

        Unloading(can_unload: True, implementations: [], ..) as runner -> {
          let results =
            [
              #(runner.current_implementation, runner.current_measurements),
              ..runner.measurements
            ]
            |> list.map(pair.map_second(_, instrumentation.to_results))
            |> list.reverse

          #(Model(..model, runner: Finished(results:)), effect.none())
        }

        Unloading(can_unload: False, ..) as runner -> {
          let runner = Unloading(..runner, can_unload: True)
          #(Model(..model, runner:), wait_for_next_frame(TryUnload))
        }

        _ -> #(model, effect.none())
      }
  }
}

fn step(runner: Runner) -> #(Runner, Effect(Msg)) {
  case runner {
    Running(steps: [step, ..steps], ..) -> {
      let model = Running(..runner, steps:)
      #(model, step.run(step, StepExecuted))
    }

    Running(steps: [], ..) -> {
      let model =
        Unloading(
          current_implementation: runner.current_implementation,
          can_unload: True,
          current_measurements: runner.current_measurements,
          implementations: runner.implementations,
          measurements: runner.measurements,
        )
      #(model, wait_for_next_frame(TryUnload))
    }

    _ -> #(runner, effect.none())
  }
}

fn wait_for_next_frame(msg) {
  use dispatch, _ <- effect.after_paint
  dispatch(msg)
}

fn view(model: Model) -> Element(Msg) {
  element.fragment([
    view_picker(model),
    case model.runner {
      NotRunYet -> view_info()
      Finished(results:) -> view_results(results)
      Running(current_implementation:, ..)
      | Loading(current_implementation:, ..)
      | Unloading(current_implementation:, ..) ->
        implementation.view_frame(
          current_implementation,
          ImplementationLoaded,
          MeasurementReceived,
        )
    },
  ])
}

fn view_picker(model: Model) -> Element(Msg) {
  let running = is_running(model)

  html.form(
    [
      attribute.id("picker"),
      attribute.disabled(running),
      event.on_submit(fn(_) { UserClickedStart }),
    ],
    [
      html.ul(
        [attribute.classes([#("running", running)])],
        list.map(model.implementations, fn(impl) {
          let checked = set.contains(model.selected, impl)
          let on_check = UserToggledImplementation(impl, _)
          html.li([], [implementation.view_selector(impl, checked, on_check)])
        }),
      ),
      html.label([], [
        html.text("# Items: "),
        html.input([
          attribute.type_("number"),
          attribute.min("1"),
          attribute.value(int.to_string(model.num_items)),
          event.on("input", {
            use value <- decode.subfield(["target", "value"], decode.string)
            case int.parse(value) {
              Ok(value) -> decode.success(UserChangedNumItems(value))
              Error(_) -> decode.failure(UserChangedNumItems(0), "value")
            }
          }),
        ]),
      ]),
      html.button([attribute.type_("submit")], [html.text("Start")]),
    ],
  )
}

fn view_info() {
  html.div([attribute.id("info")], [
    html.h1([], [html.text("Performance Comparison - TodoMVC")]),
    // html.p([], [
    //   html.text("This page lets you test the results of "),
    //   html.a(
    //     [attribute.href("http://elm-lang.org/blog/blazing-fast-html-round-two")],
    //     [html.text("Blazing Fast HTML")],
    //   ),
    //   html.text(
    //     "for yourself.",
    //   ),
    // ]),
    html.p([], [
      html.text(
        "Controls are on the right. Pick which implementations you want to race and press run. Try it in different browsers!",
      ),
    ]),
    html.h3([], [html.text("Methodology Notes")]),
    html.p([], [
      html.text(
        "To compare different frontend tools, you need to implement something in each one with exactly the same functionality. The ",
      ),
      html.a([attribute.href("http://todomvc.com")], [html.text("TodoMVC")]),
      html.text(
        " project is nice because you often get idiomatic implementations from people close to the various projects. So the code is fair, and the app itself is complex ",
      ),
      html.i([], [html.text("enough")]),
      html.text(
        "that you can do some benchmarking that can reasonably be generalized. Is modifying items in the middle of a list fast? Can the implementation tell the difference between remove-the-first-item and change-99-items-and-remove-the-last-one? Etc.",
      ),
    ]),
    html.p([], [
      html.text("The idea for this benchmark was "),
      html.a(
        [attribute.href("http://elm-lang.org/blog/blazing-fast-html-round-two")],
        [html.text("this blog post")],
      ),
      html.text(" by Evan Czaplicki."),
    ]),
  ])
}

fn view_results(data: List(#(Implementation, Results))) -> Element(msg) {
  data
  |> list.map(pair.map_first(_, implementation.to_string))
  |> instrumentation.view
}
