import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  LineChart, 
  Trophy, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: LineChart, label: 'Progress', path: '/progress' },
  { icon: Trophy, label: 'Badges', path: '/badges' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass rounded-xl text-white"
      >
        {isMobileOpen ? <X /> : <Menu />}
      </button>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ 
          width: isOpen ? 260 : 88,
          x: isMobileOpen ? 0 : (window.innerWidth < 1024 ? -300 : 0)
        }}
        className={`fixed left-0 top-0 h-screen glass border-r border-white/10 z-40 flex flex-col transition-all duration-300 ease-in-out`}
      >
        {/* Logo Section */}
        <div className="p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#00D166] flex items-center justify-center shadow-[0_0_15px_rgba(0,209,102,0.4)]">
            <span className="text-white font-black text-xl">A</span>
          </div>
          {isOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white font-black text-xl tracking-tighter"
            >
              AURAEDU
            </motion.span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative
                  ${isActive ? 'bg-white/10 text-[#00D166]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <item.icon size={24} className={isActive ? 'text-[#00D166]' : 'group-hover:text-white'} />
                {isOpen && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-bold text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-6 bg-[#00D166] rounded-r-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / Toggle Section */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex w-full items-center gap-4 p-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all group"
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
            >
              <ChevronRight size={24} />
            </motion.div>
            {isOpen && <span className="font-bold text-sm">Collapse</span>}
          </button>

          <button className="w-full flex items-center gap-4 p-3 rounded-xl text-red-400/60 hover:bg-red-400/10 hover:text-red-400 transition-all mt-2">
            <LogOut size={24} />
            {isOpen && <span className="font-bold text-sm">Logout</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
