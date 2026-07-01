import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { InventoryProvider } from './hooks/useInventory';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Layouts & Global Components
import SellerLayout from './components/SellerLayout';
import SupplierLayout from './components/SupplierLayout';
import Toast from './components/Toast';
import AIAssistantView from './components/AIAssistantView';
import VoiceWidget from './components/seller/VoiceWidget';

// Auth / Public
import LandingPage from './components/landing/LandingPage';
import Onboarding from './components/Onboarding';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';

// Seller Views
import InventoryDashboard from './components/seller/InventoryDashboard';
import InventoryView from './components/seller/InventoryView';
import SalesView from './components/seller/SalesView';
import ShelfDoctorView from './components/seller/ShelfDoctorView';
import NetworkView from './components/seller/NetworkView';

// Supplier Views
import SupplierDashboardView from './components/supplier/SupplierDashboardView';
import BroadcastView from './components/supplier/BroadcastView';
import SupplierNetworkView from './components/supplier/SupplierNetworkView';

// Shared Views
import ChatRoom from './components/ChatRoom';
import ShelfAnalysisPage from './components/ShelfAnalysisPage';
import ProfileView from './components/ProfileView';

const ProtectedRoute = () => {
    const { user, userProfile, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-2xl text-gray-800 dark:text-gray-200">Loading...</div>
            </div>
        );
    }
    
    if (!user) {
        return <Navigate to="/" replace />;
    }
    
    if (!userProfile || !userProfile.role || !userProfile.name) {
        return <Navigate to="/onboarding" replace />;
    }
    
    return (
        <InventoryProvider userId={userProfile.uid}>
            <Outlet />
            <VoiceWidget />
        </InventoryProvider>
    );
};

const RoleBasedRedirect = () => {
    const { userProfile } = useAuth();
    const role = userProfile?.role?.toLowerCase();
    
    if (role === 'seller') return <Navigate to="/seller" replace />;
    if (role === 'supplier') return <Navigate to="/supplier" replace />;
    
    return <Navigate to="/onboarding" replace />;
};

const AppContent: React.FC = () => {
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    React.useEffect(() => {
        AOS.init({ duration: 800, once: true });
    }, []);

    return (
        <BrowserRouter>
            <Toast message={toastMessage} onClose={() => setToastMessage('')} />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage onAdminClick={() => window.location.href = '/admin'} />} />
                <Route path="/admin" element={isAdminAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} onBack={() => window.location.href = '/'} />} />
                
                {/* Protected Admin Route */}
                <Route 
                    path="/admin/dashboard" 
                    element={isAdminAuthenticated ? <AdminDashboard onLogout={() => setIsAdminAuthenticated(false)} /> : <Navigate to="/admin" replace />} 
                />

                {/* Onboarding */}
                <Route path="/onboarding" element={<Onboarding />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<RoleBasedRedirect />} />

                    {/* Seller Routes */}
                    <Route path="/seller" element={<SellerLayout />}>
                        <Route index element={<InventoryDashboard />} />
                        <Route path="inventory" element={<InventoryView />} />
                        <Route path="sales" element={<SalesView />} />
                        <Route path="shelf-doctor" element={<ShelfDoctorView />} />
                        <Route path="network" element={<NetworkView />} />
                        <Route path="ai" element={<AIAssistantView />} />
                        <Route path="profile" element={<ProfileView />} />
                        <Route path="chat/:chatId" element={<ChatRoom chatParams={{chatId: '', chatTitle: 'Chat'}} onBack={() => {}} />} />
                        <Route path="analysis/:analysisId" element={<ShelfAnalysisPage analysisId="" onBack={() => {}} />} />
                    </Route>

                    {/* Supplier Routes */}
                    <Route path="/supplier" element={<SupplierLayout />}>
                        <Route index element={<SupplierDashboardView />} />
                        <Route path="broadcast" element={<BroadcastView />} />
                        <Route path="network" element={<SupplierNetworkView />} />
                        <Route path="ai" element={<AIAssistantView />} />
                        <Route path="profile" element={<ProfileView />} />
                        <Route path="chat/:chatId" element={<ChatRoom chatParams={{chatId: '', chatTitle: 'Chat'}} onBack={() => {}} />} />
                    </Route>
                </Route>
                
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <ThemeProvider>
                <AppContent />
            </ThemeProvider>
        </AuthProvider>
    );
};

export default App;
