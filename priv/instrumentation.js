(() => {
  if (!window.crossOriginIsolated) {
    console.warn('Not cross-origin isolated! measurements are less precise.')
  }
  
  const parentWindow = window.top.window
  const iframe = [...parentWindow.document.getElementsByTagName('iframe')]
    .find(iframe => iframe.contentDocument === document);

  if (!iframe) {
    return;
  }

  const timed = (type, register) => function (callback, ...args)  {
    if (!callback) return register.call(this, callback, ...args);
    
    return register.call(this, (...args) => {
      const start = performance.now()
      try {
        return callback(...args)
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
  // window.requestIdleCallback = timed('microtask', window.requestIdleCallback.bind(window))
  Promise.prototype.then = timed('promise', Promise.prototype.then)
  Promise.prototype.catch = timed('promise', Promise.prototype.catch)
  Promise.prototype.finally = timed('promise', Promise.prototype.finally)
})()
