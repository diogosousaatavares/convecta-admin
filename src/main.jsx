import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Blindagem from '@/components/Blindagem'
import './index.css'
import { iniciarIdioma } from '@/lib/idioma'

// O idioma escolhido em «Mais › Idioma» (por omissão, português).
iniciarIdioma()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Blindagem>
      <App />
    </Blindagem>
  </React.StrictMode>
)
