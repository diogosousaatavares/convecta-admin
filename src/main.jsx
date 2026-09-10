import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Blindagem from '@/components/Blindagem'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Blindagem>
      <App />
    </Blindagem>
  </React.StrictMode>
)
