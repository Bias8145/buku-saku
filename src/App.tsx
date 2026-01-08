import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Inventory } from './pages/Inventory';
import { Notes } from './pages/Notes';
import { Cashier } from './pages/Cashier'; // Import Halaman Kasir
import { ScrollToTop } from './components/ScrollToTop';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="cashier" element={<Cashier />} /> {/* Route Baru */}
                <Route path="transactions" element={<Transactions />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="notes" element={<Notes />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
