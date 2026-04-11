import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import NewPersona from './pages/NewPersona'
import EditPersona from './pages/EditPersona'
import Chat from './pages/Chat'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/personas/new" element={<NewPersona />} />
          <Route path="/personas/:id/edit" element={<EditPersona />} />
        </Route>
        {/* Chat has its own full-screen layout */}
        <Route path="/personas/:id/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  )
}
