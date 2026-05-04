import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importy komponentów wspólnych
import Navbar from './components/shared/Navbar';
import HeroSection from './components/dashboard/HeroSection';

// Importy komponentów autoryzacji
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Importy komponentów pokoi i usług
import RoomList from './components/rooms/RoomList';
import RoomBooking from './components/rooms/RoomBooking';
import ServiceList from './components/services/ServiceList';
import ServiceBooking from './components/services/ServiceBooking';

// Importy komponentów panelu administratora
import AdminDashboard from './components/admin/AdminDashboard';
import AdminPayments from './components/admin/AdminPayments';
import AdminReservations from './components/admin/AdminReservations';
import AdminReservationDetails from './components/admin/AdminReservationDetails';
import AdminGuests from './components/admin/AdminGuests';
import GuestHistory from './components/admin/GuestHistory';
import AdminIssues from './components/admin/AdminIssues';
import AdminReports from './components/admin/AdminReports';
import AdminStaff from './components/admin/AdminStaff';

// Importy komponentów panelu użytkownika
import UserAccount from './components/account/UserAccount';
import MyReservations from './components/account/MyReservations';
import ReservationDetails from './components/account/ReservationDetails';
import MyServices from './components/account/MyServices';
import MyPayments from './components/account/MyPayments';

// Import głównych styli
import './App.css';

function App() {
    return (
        <Router>
            <div className="page">
                <Navbar />
                
                <Routes>
                    {/* --- TRASY PUBLICZNE --- */}
                    <Route path="/" element={<HeroSection />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    <Route path="/rooms" element={<RoomList />} />
                    <Route path="/rooms/book/:id" element={<RoomBooking />} />
                    
                    <Route path="/services" element={<ServiceList />} />
                    <Route path="/services/book/:id" element={<ServiceBooking />} />
                    
                    {/* --- PANEL ADMINISTRATORA --- */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/payments" element={<AdminPayments />} />
                    <Route path="/admin/reservations" element={<AdminReservations />} />
                    <Route path="/admin/reservations/:id" element={<AdminReservationDetails />} />
                    <Route path="/admin/guests" element={<AdminGuests />} />
                    <Route path="/admin/guests/:guestId/history" element={<GuestHistory />} />
                    <Route path="/admin/issues" element={<AdminIssues />} />
                    <Route path="/admin/reports" element={<AdminReports />} />
                    <Route path="/admin/staff" element={<AdminStaff />} />

                    {/* --- PANEL RECEPCJI --- */}
                    {/* Na razie delegujemy recepcjonistę do panelu admina */}
                    <Route path="/reception" element={<Navigate to="/admin" />} />

                    {/* --- PANEL UŻYTKOWNIKA (KONTO) --- */}
                    <Route path="/account" element={<UserAccount />} />
                    <Route path="/account/reservations" element={<MyReservations />} />
                    {/* Ścieżka do szczegółów rezerwacji użytkownika */}
                    <Route path="/account/reservations/:id" element={<ReservationDetails />} />
                    <Route path="/account/services" element={<MyServices />} />
                    <Route path="/account/payments" element={<MyPayments />} />

                    {/* --- FALLBACK (404) --- */}
                    {/* Jeśli ktoś wpisze bzdurę w URL, wrzuć go na stronę główną */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;