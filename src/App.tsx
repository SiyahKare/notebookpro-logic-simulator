import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AIAssistant from './components/AIAssistant';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import LoadingSpinner from './components/LoadingSpinner';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { UserRole } from './types';

// Lazy loaded pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Service = lazy(() => import('./pages/Service'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const DealerDashboard = lazy(() => import('./pages/DealerDashboard'));
const TechnicianDashboard = lazy(() => import('./pages/TechnicianDashboard'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Products = lazy(() => import('./pages/Products'));
const Profile = lazy(() => import('./pages/Profile'));
const Orders = lazy(() => import('./pages/Orders'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  // Wait for auth to initialize
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { actualTheme } = useTheme();

  return (
    <div className={`min-h-screen font-sans selection:bg-red-100 selection:text-red-900 transition-colors duration-300 ${
      actualTheme === 'dark' 
        ? 'bg-slate-900 text-slate-100' 
        : 'bg-slate-50 text-slate-900'
    }`}>
      <Navbar />
      
      <main className="animate-in fade-in duration-300">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:category" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/service" element={<Service />} />
            <Route path="/service/:trackingCode" element={<Service />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/contact" element={<Contact />} />

            {/* Admin Routes */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Dealer Routes */}
            <Route 
              path="/dealer/*" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.DEALER]}>
                  <DealerDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Technician Routes */}
            <Route 
              path="/technician/*" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.TECHNICIAN]}>
                  <TechnicianDashboard />
                </ProtectedRoute>
              } 
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <AIAssistant />
      <CookieBanner />
      <Footer />
    </div>
  );
};

export default App;
