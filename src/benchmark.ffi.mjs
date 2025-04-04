export function setup_instrumentation() {
  const iframe = document.getElementById('benchmark')

  const globalSetTimeout = iframe.contentWindow.setTimeout.bind(iframe.contentWindow)
  const globalRaf = iframe.contentWindow.requestAnimationFrame.bind(iframe.contentWindow)
  const globalCaf = iframe.contentWindow.cancelAnimationFrame.bind(iframe.contentWindow)
  let rafQueue = []
  let nextRafId = null

  iframe.contentWindow.requestAnimationFrame = function requestAnimationFrame(callback) {
    rafQueue.push(callback)
    if (nextRafId === null) nextRafId = globalRaf(runAnimationFrame)
    return [nextRafId, callback]
  }

  iframe.contentWindow.cancelAnimationFrame = function cancelAnimationFrame([rafId, callback]) {
    if (rafId !== nextRafId) {
      return
    }
  
    const index = rafQueue.indexOf(callback)
    if (index < 0) {
      return
    }

    rafQueue.splice(index, 1)
    if (!rafQueue.length) {
      globalCaf(nextRafId)
      nextRafId = null;
    }
  }

  iframe.contentWindow.setTimeout = function setTimeout(handler, timeout, ...args) {
    return globalSetTimeout(function() {
      const start = performance.now()
      try {
        handler(...args)
      } finally {
        const elapsed = performance.now() - start
        const event = new CustomEvent('lustre-benchmark:measurement', {
          detail: { type: 'async', elapsed }
        })
        iframe.dispatchEvent(event)
      }
    }, timeout, ...args)
  }

  function runAnimationFrame() {
    const queue = rafQueue;
    rafQueue = [];
    nextRafId = null;

    const start = performance.now()
    for (const callback of queue) {
      try {
        callback()
      } catch(e) {
        console.error(e)
      }
    }

    const elapsed = performance.now() - start

    const event = new CustomEvent('lustre-benchmark:measurement', {
      detail: { type: "async", elapsed }
    })
    iframe.dispatchEvent(event)
  }

}

