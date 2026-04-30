import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- Layout Import ---
import DashboardLayout from './components/DashboardLayout'; 

// --- Auth & Core Pages ---
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // ✅ Yahi Main Dashboard sab use karenge

// --- Donor Features ---
import AddProduct from './pages/AddProduct';
import DonationHistory from './pages/DonationHistory';

// --- Admin Features ---
import ApproveDonations from './pages/ApproveDonations';
import ManageUsers from './pages/ManageUsers';
import ViewOrders from './pages/ViewOrders';
import SystemReports from './pages/SystemReports'; 
import VerifyUsers from './pages/VerifyUsers';
import AdminTransactions from './pages/AdminTransactions'; 
import AddDeliveryPartner from './pages/AddDeliveryPartner';
// ✅ Warehouse Verification (Isse mat udana)
import InventoryVerification from './pages/InventoryVerification'; 

// ❌ Removed: DeliveryDashboard (Kyunki ab Delivery Boy 'Dashboard' page hi use karega)

// --- Consumer Features (Orphanage/Buyer) ---
import BrowseItems from './pages/BrowseItems';
import MyRequests from './pages/MyRequests';
import CompleteProfile from './pages/CompleteProfile';
import TransactionHistory from './pages/TransactionHistory';

// --- Utility Pages ---
import Messages from './pages/Messages';
import Settings from './pages/Settings';

function App() {
  // 💡 Helper: Sidebar Layout Injection
  const withLayout = (Component) => (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          
          {/* ✅ Core Dashboard (Admin, Donor, Delivery, Buyer - Sab Yahan) */}
          <Route path="/dashboard" element={withLayout(Dashboard)} />
          
          {/* Donor Features */}
          <Route path="/add-product" element={withLayout(AddProduct)} />
          <Route path="/donation-history" element={withLayout(DonationHistory)} />

          {/* Admin Features */}
          <Route path="/approve-donations" element={withLayout(ApproveDonations)} />
          <Route path="/manage-users" element={withLayout(ManageUsers)} />
          <Route path="/view-orders" element={withLayout(ViewOrders)} />
          <Route path="/system-reports" element={withLayout(SystemReports)} />
          <Route path="/verify-users" element={withLayout(VerifyUsers)} />
          <Route path="/admin-transactions" element={withLayout(AdminTransactions)} />
          <Route path="/add-delivery-partner" element={withLayout(AddDeliveryPartner)} />
          
          {/* ✅ Inventory Verification Route */}
          <Route path="/inventory-verification" element={withLayout(InventoryVerification)} />

          {/* Consumer Features (Orphanage/Buyer) */}
          <Route path="/browse-items" element={withLayout(BrowseItems)} />
          <Route path="/my-requests" element={withLayout(MyRequests)} />
          <Route path="/complete-profile" element={withLayout(CompleteProfile)} />
          <Route path="/transaction-history" element={withLayout(TransactionHistory)} />

          {/* General Utilities */}
          <Route path="/messages" element={withLayout(Messages)} />
          <Route path="/settings" element={withLayout(Settings)} />
          <Route path="/edit-user/:id" element={withLayout(Settings)} />
          <Route path="/inquiries" element={withLayout(Messages)} />

          {/* Default Redirects */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;