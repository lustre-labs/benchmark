(() => {
  if (!window.crossOriginIsolated) {
    console.warn('Not cross-origin isolated! measurements are less precise.')
  }
  
  const parentWindow = window.top.window
  const iframe = [...parentWindow.document.getElementsByTagName('iframe')]
    .find(iframe => iframe.contentDocument === document);

  const timed = (type, register) => (callback, ...args) => {
    register((...args) => {
      const start = performance.now()
      try {
        callback(...args)
      } finally {
        const elapsed = performance.now() - start
        const event = new CustomEvent('lustre-benchmark:measurement', {
          detail: { type, elapsed }
        })
        iframe.dispatchEvent(event)
      }
    }, ...args)
  }

  window.setTimeout = timed('timeout', window.setTimeout.bind(window))
  window.requestAnimationFrame = timed('animation_frame', window.requestAnimationFrame.bind(window))
  window.queueMicrotask = timed('microtask', window.queueMicrotask.bind(window)) 
})()
