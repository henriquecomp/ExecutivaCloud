import React, { useMemo } from 'react';
import { View, User } from '../types';
import { LogoIcon } from './Icons';
import SidebarNavLink from './sidebar/SidebarNavLink';
import { SIDEBAR_NAV_ITEMS } from './sidebar/sidebarNavItems';
import { getVisibleNavItems } from './sidebar/getVisibleNavItems';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  currentUser: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, currentView, setCurrentView, isOpen, setOpen }) => {
  const appVersion = '1.3.0';

  const allNavItems = useMemo(() => SIDEBAR_NAV_ITEMS, []);

  const visibleNavItems = useMemo(
    () => getVisibleNavItems(currentUser, allNavItems),
    [currentUser, allNavItems],
  );

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    if (window.innerWidth < 1024) { // Close sidebar on mobile after navigation
      setOpen(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      ></div>

      <aside className={`fixed lg:relative top-0 left-0 h-full bg-slate-800 text-white w-64 flex flex-col z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-center p-6 border-b border-slate-700">
          <LogoIcon className="w-8 h-8" />
          <h1 className="text-xl font-bold ml-3">Executiva Cloud</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {visibleNavItems.map((item) => (
            <SidebarNavLink
              key={item.view}
              item={item}
              currentView={currentView}
              onClick={handleNavClick}
            />
          ))}
        </nav>
        <div className="p-6 border-t border-slate-700">
            <p className="text-xs text-slate-400">{`© ${new Date().getFullYear()} Executiva Cloud`}</p>
            <p className="text-xs text-slate-500 mt-1">{`Versão ${appVersion}`}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;