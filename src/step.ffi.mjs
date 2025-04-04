export async function set_value(selector, value, callback) {
  const element = await wait_for_element(selector)
  const event = new Event('input', { bubbles: true })

  timed(() => {
    element.value = value
    element.dispatchEvent(event)
  })

  wait_for_rerender(callback)
}

export async function press_enter(selector, callback) {
  const element = await wait_for_element(selector)
  const event = new Event('keydown', { bubbles: true })
  event.key = 'Enter'
  event.keyCode = event.which = 13

  timed(() => element.dispatchEvent(event))

  wait_for_rerender(callback)
}

export async function click(selector, callback) {
  const element = await wait_for_element(selector)

  timed(() => element.click())

  wait_for_rerender(callback)
}

function wait_for_element(selector) {
  const iframe = document.getElementById('benchmark')
  
  function go(resolve) {
    const element = iframe.contentDocument.querySelector(selector)
    if (element) {
      resolve(element)
    } else {
      setTimeout(go, 50, resolve)
    }
  }
  
  return new Promise(resolve => go(resolve))
}

function timed(callback) {
  const start = performance.now()
  callback()
  const elapsed = performance.now() - start

  const iframe = document.getElementById('benchmark')
  const event = new CustomEvent('lustre-benchmark:measurement', {
    detail: { type: 'sync', elapsed }
  })
  iframe.dispatchEvent(event)
}

function wait_for_rerender(callback) {
  requestAnimationFrame(() =>
    queueMicrotask(callback))
}
