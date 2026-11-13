import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './app/App.tsx'
import { AuthProvider } from './features/auth/AuthProvider'

const previewParams = new URLSearchParams(window.location.search)
if (previewParams.get('bxDevicePreview') === '1') {
  document.documentElement.dataset.devicePreview = 'true'
  if (previewParams.get('bxDynamicIsland') === '1') {
    document.documentElement.dataset.dynamicIsland = 'true'
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
