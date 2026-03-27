import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Direct imports (not lazy loaded to prevent white page issues)
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ReportForm from './pages/ReportForm.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import AuthorityDashboard from './pages/AuthorityDashboard.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Rewards from './pages/Rewards.jsx';
import RouteOptimization from './pages/RouteOptimization.jsx';
import AnalyticsDashboard from './pages/AnalyticsDashboard.jsx';
import Profile from './pages/Profile.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Challenges from './pages/Challenges.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import {
  LayoutDashboard,
  MapPin,
  Trophy,
  Gift,
  Target,
  Shield,
  Route as RouteIcon,
  BarChart3,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const NavLink = ({ to, icon: Icon, label, isActive }) => (
  <Link
    to={to}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-emerald-100 text-emerald-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </Link>
);

const Shell = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isActive = (path) => location.pathname === path;

  const userNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/report', label: 'Report', icon: MapPin },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/rewards', label: 'Rewards', icon: Gift },
    { path: '/challenges', label: 'Challenges', icon: Target },
  ];

  const adminNavItems = [
    { path: '/admin', label: 'Admin', icon: Shield },
    { path: '/route', label: 'Route', icon: RouteIcon },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-slate-900">Clean-In</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {userNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive(item.path)}
                />
              ))}
              {user?.role === 'admin' && (
                <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200">
                  {adminNavItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      icon={item.icon}
                      label={item.label}
                      isActive={isActive(item.path)}
                    />
                  ))}
                </div>
              )}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive('/profile')
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200"
                >
                  <span>Login</span>
                </Link>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200">
            <div className="px-4 py-3 space-y-1">
              {userNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive(item.path)}
                />
              ))}
              {user?.role === 'admin' && (
                <div className="pt-2 mt-2 border-t border-slate-200">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
                    Admin
                  </div>
                  {adminNavItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      icon={item.icon}
                      label={item.label}
                      isActive={isActive(item.path)}
                    />
                  ))}
                </div>
              )}
              {user && (
                <div className="pt-2 mt-2 border-t border-slate-200">
                  <Link
                    to="/profile"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive('/profile')
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter basename="/clean-in">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Shell>
                  <UserDashboard />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <Shell>
                  <ReportForm />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Shell>
                  <Leaderboard />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rewards"
            element={
              <ProtectedRoute>
                <Shell>
                  <Rewards />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenges"
            element={
              <ProtectedRoute>
                <Shell>
                  <Challenges />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Shell>
                  <AuthorityDashboard />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/route"
            element={
              <ProtectedRoute requireAdmin>
                <Shell>
                  <RouteOptimization />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute requireAdmin>
                <Shell>
                  <AnalyticsDashboard />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Shell>
                  <Profile />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);

