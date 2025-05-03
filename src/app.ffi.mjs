export function get_implementations() {
  return JSON.parse(document.getElementById('implementations').textContent)
}

export function is_cross_origin_isolated() {
  return window.crossOriginIsolated
}
