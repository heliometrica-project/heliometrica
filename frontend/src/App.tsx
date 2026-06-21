import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RootLayout } from './layouts/RootLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { SolarModulesList } from './pages/SolarModulesList'
import { SolarModulesForm } from './pages/SolarModulesForm'
import { History } from './pages/History'
import { ComparePage } from './pages/ComparePage'
import { EstimatePage } from './pages/EstimatePage'
import { HistoryPage } from './pages/HistoryPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/modules" element={<SolarModulesList />} />
              <Route path="/modules/new" element={<SolarModulesForm />} />
              <Route path="/modules/:id/edit" element={<SolarModulesForm />} />
              <Route path="/history" element={<History />} />
              <Route path="/estimate" element={<EstimatePage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
