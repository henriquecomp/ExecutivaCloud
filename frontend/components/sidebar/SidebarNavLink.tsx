import React from 'react';
import { View } from '../../types';
import { SidebarNavItem } from './SidebarNavItem';

interface SidebarNavLinkProps {
  item: SidebarNavItem;
  currentView: View;
  onClick: (view: View) => void;
}

const SidebarNavLink: React.FC<SidebarNavLinkProps> = ({ item, currentView, onClick }) => {
  return (
    <a
      href="#"
      onClick={(event) => {
        event.preventDefault();
        onClick(item.view);
      }}
      className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
        currentView === item.view
          ? 'bg-slate-900 text-white font-semibold'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {item.icon}
      <span className="ml-4 capitalize">{item.label}</span>
    </a>
  );
};

export default SidebarNavLink;
