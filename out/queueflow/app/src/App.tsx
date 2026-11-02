import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HomeRedirect } from './components/HomeRedirect';
import { RoleGate } from './components/RoleGate';
import { ShellLayout } from './components/ShellLayout';
import { SessionProvider } from './hooks/useSession';
import { ToastProvider } from './hooks/useToast';
import { AdminBranchesPage } from './pages/AdminBranchesPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminMonitorPage } from './pages/AdminMonitorPage';
import { AdminServicesPage } from './pages/AdminServicesPage';
import { AdminStaffPage } from './pages/AdminStaffPage';
import { CustomerBookPage } from './pages/CustomerBookPage';
import { CustomerHistoryPage } from './pages/CustomerHistoryPage';
import { CustomerServicesPage } from './pages/CustomerServicesPage';
import { CustomerTicketsPage } from './pages/CustomerTicketsPage';
import { DisplayPage } from './pages/DisplayPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { StaffDeskPage } from './pages/StaffDeskPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/display" element={<DisplayPage />} />
          <Route
            element={
              <SessionProvider>
                <ShellLayout />
              </SessionProvider>
            }
          >
            <Route index element={<HomeRedirect />} />
            <Route path="/customer" element={<RoleGate role="customer"><CustomerBookPage /></RoleGate>} />
            <Route path="/customer/services" element={<RoleGate role="customer"><CustomerServicesPage /></RoleGate>} />
            <Route path="/customer/tickets" element={<RoleGate role="customer"><CustomerTicketsPage /></RoleGate>} />
            <Route path="/customer/history" element={<RoleGate role="customer"><CustomerHistoryPage /></RoleGate>} />
            <Route path="/staff" element={<RoleGate role="staff"><StaffDeskPage /></RoleGate>} />
            <Route path="/admin" element={<RoleGate role="admin"><AdminDashboardPage /></RoleGate>} />
            <Route path="/admin/monitor" element={<RoleGate role="admin"><AdminMonitorPage /></RoleGate>} />
            <Route path="/admin/branches" element={<RoleGate role="admin"><AdminBranchesPage /></RoleGate>} />
            <Route path="/admin/services" element={<RoleGate role="admin"><AdminServicesPage /></RoleGate>} />
            <Route path="/admin/staff" element={<RoleGate role="admin"><AdminStaffPage /></RoleGate>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
