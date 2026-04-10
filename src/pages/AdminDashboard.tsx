import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  BarChart3, 
  LogOut, 
  Menu, 
  Settings,
  Cpu,
  Wrench,
  Factory,
  X,
  ChevronRight
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';

// Sub-pages
import DashboardOverview from './admin/DashboardOverview';
import JobManagement from './admin/JobManagement';
import ApplicationManagement from './admin/ApplicationManagement';
import MachineManagement from './admin/MachineManagement';
import SkillManagement from './admin/SkillManagement';
import FactoryManagement from './admin/FactoryManagement';
import Reports from './admin/Reports';

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
    { icon: Briefcase, label: 'Jobs', path: '/admin/jobs' },
    { icon: Users, label: 'Applications', path: '/admin/applications' },
    { icon: Cpu, label: 'Machines', path: '/admin/machines' },
    { icon: Wrench, label: 'Skills', path: '/admin/skills' },
    { icon: Factory, label: 'Factories', path: '/admin/factories' },
    { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-gray-900 text-white w-64 fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">P</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Admin Panel</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                  isActive ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400 group-hover:text-white")} />
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        isSidebarOpen ? "lg:ml-64" : "ml-0"
      )}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40">
          <button onClick={() => setIsSidebarOpen(true)} className={cn("lg:hidden", isSidebarOpen && "hidden")}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{auth.currentUser?.email}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </header>

        <div className="p-8">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/jobs" element={<JobManagement />} />
            <Route path="/applications" element={<ApplicationManagement />} />
            <Route path="/machines" element={<MachineManagement />} />
            <Route path="/skills" element={<SkillManagement />} />
            <Route path="/factories" element={<FactoryManagement />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
