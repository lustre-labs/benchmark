import filepath
import gleam/http/request.{type Request}
import gleam/http/response
import gleam/javascript/promise
import gleam/option
import smol

pub fn main() {
  smol.new(handler)
  |> smol.start()
}

fn handler(req: Request(_)) {
  use <- cross_origin_isolated()

  case filepath.expand(req.path) {
    Error(_) -> promise.resolve(smol.send_status(400))
    Ok(path) -> {
      let path = filepath.join("./", path)
      use <- try_serve_file(path)

      let path = filepath.join(path, "/index.html")
      use <- try_serve_file(path)

      promise.resolve(smol.send_status(404))
    }
  }
}

fn cross_origin_isolated(next) {
  use response <- promise.await(next())
  let response =
    response
    |> response.set_header("cross-origin-opener-policy", "same-origin")
    |> response.set_header("cross-origin-embedder-policy", "require-corp")
  promise.resolve(response)
}

fn try_serve_file(path, fallback) {
  use response <- promise.await(smol.send_file(path, 0, option.None))
  case response {
    Ok(response) -> promise.resolve(response)
    Error(_) -> fallback()
  }
}
