export function set_value(selector, value, callback) {
  wait_for_element(selector, element => {
    const event = new Event('input', { bubbles: true })

    timed(() => {
      element.value = value
      element.dispatchEvent(event)
    })

    wait_for_rerender(callback)
  })
}

export function press_enter(selector, callback) {
  wait_for_element(selector, element => { 
    const event = new Event('keydown', { bubbles: true })
    event.key = 'Enter'
    event.keyCode = event.which = 13

    timed(() => element.dispatchEvent(event))

    wait_for_rerender(callback)
  })
}

export function click(selector, callback) {
  wait_for_element(selector, element => {
    timed(() => element.click())
    wait_for_rerender(callback)
  })
}

export function wait_for_element(selector, callback) {
  const iframe = document.getElementById('benchmark')
  
  function go(resolve) {
    const element = querySelectorShadowDom.querySelectorDeep(selector, iframe.contentDocument)
    if (element) {
      resolve(element)
    } else {
      console.log(selector)
      setTimeout(go, 100, resolve)
    }
  }

  go(callback)
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
    requestAnimationFrame(() =>
      queueMicrotask(callback)))
}
