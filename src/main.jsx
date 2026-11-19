import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Tipografías servidas desde el propio proyecto (sin depender de Google Fonts)
import '@fontsource-variable/inter'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'
import './styles/global.css'
import './styles/glass.css'
import './styles/layout.css'
import './styles/transit.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
