import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
import PoolWallet from './pages/PoolWallet'
import Debts from './pages/Debts'
import Settlement from './pages/Settlement'
import { PageWrapper } from './components/layout/PageWrapper'
import { SkeletonList } from './components/ui/Skeleton'

function Protected({ children }) {
  const { session, loading, isSupabaseConfigured } = useAuth()
  if (!isSupabaseConfigured) {
    return <PageWrapper>Add Supabase keys in .env.local</PageWrapper>
  }
  if (loading) {
    return (
      <PageWrapper>
        <SkeletonList />
      </PageWrapper>
    )
  }
  if (!session) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />
          <Route
            path="/add-expense"
            element={
              <Protected>
                <AddExpense />
              </Protected>
            }
          />
          <Route
            path="/pool"
            element={
              <Protected>
                <PoolWallet />
              </Protected>
            }
          />
          <Route
            path="/debts"
            element={
              <Protected>
                <Debts />
              </Protected>
            }
          />
          <Route
            path="/settlement"
            element={
              <Protected>
                <Settlement />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
