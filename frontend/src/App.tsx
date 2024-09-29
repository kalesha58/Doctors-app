import { ToastContainer } from 'react-toastify'
import './App.css'
import Home from './pages/Home'
import { Route, Routes } from 'react-router-dom'

function App() {

  return (
    <div className='mx-4 sm:mx-[10%]'>
      <ToastContainer />
      <Routes>
        <Route path='/' element={<Home/>}/>
      </Routes>
      </div>
  )
}

export default App
