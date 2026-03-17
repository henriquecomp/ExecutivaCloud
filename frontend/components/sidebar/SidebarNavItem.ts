import React from 'react';
import { View } from '../../types';

export interface SidebarNavItem {
  view: View;
  label: string;
  icon: React.ReactNode;
}
