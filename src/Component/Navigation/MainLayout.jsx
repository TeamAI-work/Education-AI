import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Sidebar />
      {/* Content Area */}
      <div className="lg:pl-24 transition-all duration-300">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

