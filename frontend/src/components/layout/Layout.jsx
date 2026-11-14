import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const Layout = () => {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
