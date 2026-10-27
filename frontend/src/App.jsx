import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'

import Navbar from './components/Navbar'
import Footer from './components/Footer'

import HomePage            from './pages/HomePage'
import DestinationsPage    from './pages/DestinationsPage'
import DestinationDetailPage from './pages/DestinationDetailPage'
import LoginPage           from './pages/LoginPage'
import RegisterPage        from './pages/RegisterPage'
import ChatbotPage         from './pages/ChatbotPage'
import TripPlannerPage     from './pages/TripPlannerPage'
import ProfilePage         from './pages/ProfilePage'
import AdminDashboardPage  from './pages/AdminDashboardPage'
import MyTripsPage         from './pages/MyTripsPage'
import SharedItineraryPage from './pages/SharedItineraryPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
})

// Protected route wrapper
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/"                    element={<HomePage />} />
              <Route path="/destinations"        element={<DestinationsPage />} />
              <Route path="/destinations/:id"    element={<DestinationDetailPage />} />
              <Route path="/login"               element={<LoginPage />} />
              <Route path="/register"            element={<RegisterPage />} />
              <Route path="/chatbot"             element={<ChatbotPage />} />
              <Route path="/planner"             element={<TripPlannerPage />} />
              <Route path="/route-planner"       element={<Navigate to="/planner" replace />} />
              <Route path="/my-trips"            element={<PrivateRoute><MyTripsPage /></PrivateRoute>} />
              <Route path="/shared/:token"        element={<SharedItineraryPage />} />
              <Route path="/profile"             element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="/admin"               element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />

              {/* Catch-all */}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                  <p className="text-8xl">🌏</p>
                  <h2 className="text-3xl font-bold text-white">Page Not Found</h2>
                  <a href="/" className="text-saffron-400 hover:underline">← Back to Home</a>
                </div>
              } />
            </Routes>
          </main>
          <Footer />
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a2340',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
