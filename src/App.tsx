import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TrackList from './pages/TrackList'
import TrackDetails from './pages/TrackDetails'
import DataEntry from './pages/DataEntry'
import TyreOverview from './pages/TyreOverview'
import StrategyOverview from './pages/StrategyOverview'
import FuelOverview from './pages/FuelOverview'
import HotlapsAndSetups from './pages/HotlapsAndSetups'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminPanel from './pages/AdminPanel'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { TrackDataProvider } from './context/TrackDataContext'

function App() {
  return (
    <AuthProvider>
      <TrackDataProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracks"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TrackList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracks/:trackId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TrackDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tyres"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TyreOverview />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/strategies"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StrategyOverview />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fuel"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FuelOverview />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/hotlaps"
              element={
                <ProtectedRoute>
                  <Layout>
                    <HotlapsAndSetups />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/data-entry"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DataEntry />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminPanel />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </TrackDataProvider>
    </AuthProvider>
  )
}

export default App
