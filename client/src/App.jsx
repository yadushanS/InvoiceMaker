import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FolderPage from './pages/FolderPage.jsx';
import InvoiceEditor from './pages/InvoiceEditor.jsx';
import BusinessSettings from './pages/BusinessSettings.jsx';
import { useAuth } from './context/AuthContext.jsx';

export default function App() {
  const { business } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    if (business?.themeColors?.primary) {
      root.style.setProperty('--accent', business.themeColors.primary);
      root.style.setProperty('--accent-dark', business.themeColors.dark || business.themeColors.primary);
      root.style.setProperty('--accent-text', business.themeColors.accentText || '#ffffff');
    } else {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-dark');
      root.style.removeProperty('--accent-text');
    }
  }, [business]);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/folders/:folderId" element={<ProtectedRoute><FolderPage /></ProtectedRoute>} />
          <Route path="/folders/:folderId/invoices/new" element={<ProtectedRoute><InvoiceEditor /></ProtectedRoute>} />
          <Route path="/invoices/:invoiceId" element={<ProtectedRoute><InvoiceEditor /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><BusinessSettings /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}
