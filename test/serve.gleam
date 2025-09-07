import filepath
import gleam/http/request.{type Request}
import gleam/option.{None}
import smol

pub fn main() {
  smol.new(handler)
  |> smol.start()
}

fn handler(req: Request(_)) {
  use <- cross_origin_isolated()

  case filepath.expand(req.path) {
    Error(_) -> smol.send_status(400)
    Ok(path) -> {
      let path = filepath.join("./", path)
      use _err <- smol.send_file(path, 0, None)
      use _err2 <- smol.send_file(filepath.join(path, "/index.html"), 0, None)
      smol.send_status(404)
    }
  }
}

fn cross_origin_isolated(next) {
  next()
  |> smol.with_extra_headers([
    #("cross-origin-opener-policy", "same-origin"),
    #("cross-origin-embedder-policy", "require-corp"),
  ])
}
