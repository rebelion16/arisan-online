import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ArisanProvider } from './context/ArisanContext';
import { ToastProvider } from './context/ToastContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CreateArisan from './pages/CreateArisan';
import JoinArisan from './pages/JoinArisan';
import ArisanDetail from './pages/ArisanDetail';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="avatar avatar-lg mx-auto mb-md animate-pulse" style={{ margin: '0 auto', marginBottom: 'var(--space-md)' }}>
            💰
          </div>
          <p className="text-muted">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main App Routes
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/join" element={<JoinArisan />} />
      <Route path="/join/:code" element={<JoinArisan />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <CreateArisan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/arisan/:id"
        element={
          <ProtectedRoute>
            <ArisanDetail />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// App Component
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ArisanProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </ArisanProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
