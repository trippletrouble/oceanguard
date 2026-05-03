import './App.css'
import Header from './components/Header'
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <div className='w-full min-h-screen'>
      <Header />

      <main className='pt-32'>
        <LandingPage />
      </main>
    </div>
  )
}

export default App
