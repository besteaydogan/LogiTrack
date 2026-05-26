import { AlertTriangle, BarChart3, LayoutDashboard, PackageCheck, Truck } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import './MainLayout.css';

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
};

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/deliveries', label: 'Deliveries', icon: PackageCheck },
  { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/fleet', label: 'Fleet', icon: Truck },
];

export function MainLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            LT
          </span>
          <div>
            <strong>LogiTrack</strong>
            <span>Control Tower</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="app-frame">
        <header className="topbar">
          <div>
            <p className="topbar__eyebrow">Operations workspace</p>
            <h1>Logistics Control Tower</h1>
          </div>
          <div className="topbar__status" aria-label="Current data mode">
            REST API
          </div>
        </header>

        <main className="content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
