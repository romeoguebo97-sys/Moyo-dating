import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../moyo-complet'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)