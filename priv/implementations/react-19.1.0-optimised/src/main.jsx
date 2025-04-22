import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router'

import App from './App.jsx'

createRoot(document.querySelector('.todoapp')).render(
  <StrictMode>
      <HashRouter>
        <Routes>
          <Route path="*" element={<App />} />
        </Routes>
    </HashRouter>
  </StrictMode>,
)
