import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Trophy,
  Gift,
  BarChart3,
  Target,
  Shield,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/report', label: 'Report Waste', icon: MapPin },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/rewards', label: 'Rewards', icon: Gift },
    ...(user?.role === 'admin' ? [{ path: '/analytics', label: 'Analytics', icon: BarChart3 }] : []),
    { path: '/challenges', label: 'Challenges', icon: Target },
    ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin Panel', icon: Shield }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-[60] lg:hidden bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-lg shadow-lg transition-colors flex items-center justify-center"
        aria-label="Toggle menu"
      >
        <Menu size={22} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-emerald-900 text-white transition-all duration-300 z-50
          ${collapsed ? 'w-16' : 'w-56'} 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-800">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold">C</span>
              </div>
              <span className="font-semibold text-lg">Clean-In</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-6 h-6 bg-emerald-700 hover:bg-emerald-600 rounded-full transition-colors"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                  ${active 
                    ? 'bg-emerald-700 text-white shadow-md' 
                    : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'}`}
              >
                <Icon 
                  size={20} 
                  className={`${active ? 'text-emerald-300' : 'text-emerald-400 group-hover:text-emerald-300'}`}
                />
                {!collapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-emerald-800">
          <button
            onClick={logout}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg text-emerald-100 hover:bg-emerald-800 hover:text-white transition-all duration-200 w-full
              ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} className="text-emerald-400" />
            {!collapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Spacer */}
      <div className={`hidden lg:block transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`} />
    </>
  );
};

export default Sidebar;
