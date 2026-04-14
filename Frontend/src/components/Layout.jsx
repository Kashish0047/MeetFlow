import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Calendar, Clock, LayoutDashboard, User, Menu, X, Globe } from 'lucide-react';

const Sidebar = ({ isOpen, toggle }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Event Types', icon: LayoutDashboard, path: '/' },
    { name: 'Bookings', icon: Calendar, path: '/bookings' },
    { name: 'Availability', icon: Clock, path: '/availability' },
    { name: 'Schedules', icon: Globe, path: '/schedules' },
  ];

  return (
    <>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={toggle}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 w-64 border-r border-gray-100 flex flex-col bg-white z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Calendar className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">MeetFlow</span>
          </div>
          <button onClick={toggle} className="lg:hidden p-1">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isOpen && toggle()}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-bold text-sm ${
                location.pathname === item.path
                  ? 'bg-gray-50 text-black shadow-sm'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-black'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-50">
          <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                  <User className="text-gray-400 w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">MeetFlow</p>
                  <p className="text-[10px] font-bold text-gray-400 truncate uppercase tracking-tighter">hello@meetflow.com</p>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden p-4 border-b border-gray-50 flex items-center gap-4 sticky top-0 bg-white z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-50 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-black tracking-tight text-lg">MeetFlow</span>
        </header>

        <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
