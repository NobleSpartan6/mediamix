import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="min-h-screen bg-panel-bg text-white flex flex-col items-center justify-center p-10 font-sans">
      <header className="mb-12 text-center">
        <h1 className="text-accent text-ui-heading font-ui-semibold mb-4">
          Motif
        </h1>
        <p className="text-ui-body font-ui-normal text-gray-400">
          Local-First ✕ Hybrid AI Video Editor
        </p>
      </header>

      <main className="w-full max-w-2xl space-y-8">
        <section>
          <h2 className="text-ui-body font-ui-medium text-gray-300 mb-3">Design Token Showcase:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800 rounded-lg">
              <p className="text-ui-label font-ui-medium text-accent mb-1">Label Text (11px, Medium)</p>
              <p className="text-ui-body font-ui-normal">Body Text (14px, Normal)</p>
              <p className="text-ui-heading font-ui-semibold mt-2">Heading Text (24px, Semibold)</p>
            </div>
            <div 
              className={`p-4 bg-gray-800 rounded-lg transition-all duration-150 ${isHovered ? 'ring-2 ring-accent' : 'ring-transparent'}`}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <p className="text-ui-label font-ui-medium text-accent mb-1">Transition Test (150ms)</p>
              <p className="text-ui-body font-ui-normal">Hover over this box to see the accent ring.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-ui-body font-ui-medium text-gray-300 mb-3">Clip Color Placeholders:</h2>
          <div className="flex space-x-4">
            <div className="w-1/2 h-20 bg-clip-video rounded-md flex items-center justify-center">
              <span className="text-ui-label font-ui-medium text-white/80">Video Clip Area</span>
            </div>
            <div className="w-1/2 h-20 bg-clip-audio rounded-md flex items-center justify-center">
              <span className="text-ui-label font-ui-medium text-white/80">Audio Clip Area</span>
            </div>
          </div>
        </section>

        <footer className="mt-12 text-center">
          <p className="text-ui-label font-ui-medium text-gray-500">
            Testing Tailwind CSS granular tokens for Motif.
          </p>
        </footer>
      </main>
    </div>
  )
}

export default App
