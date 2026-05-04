import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importy komponentów (upewnij się, że utworzyłeś te pliki!)
import Navbar from './components/shared/Navbar';
import HeroSection from './components/dashboard/HeroSection';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import RoomList from './components/rooms/RoomList';
import RoomBooking from './components/rooms/RoomBooking';
import ServiceList from './components/services/ServiceList';
import ServiceBooking from './components/services/ServiceBooking';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminPayments from './components/admin/AdminPayments';
import AdminReservations from './components/admin/AdminReservations';
// Importujemy pozostałe komponenty, które zaraz dodamy
import AdminGuests from './components/admin/AdminGuests';
import AdminIssues from './components/admin/AdminIssues';
import AdminReports from './components/admin/AdminReports';
import AdminStaff from './components/admin/AdminStaff';
import GuestHistory from './components/admin/GuestHistory';
import UserAccount from './components/account/UserAccount';
import MyReservations from './components/account/MyReservations';
import MyServices from './components/account/MyServices';
import MyPayments from './components/account/MyPayments';
import ReservationDetails from './components/account/ReservationDetails';

// Import CSS
import './App.css';

function App() {
    return (
        <Router>
            <div className="page" style={{ fontFamily: "Georgia, sans-serif", background: "#f8f9fa", minHeight: "100vh" }}>
                <Navbar />
                
                <Routes>
                    {/* Trasy publiczne */}
                    <Route path="/" element={<HeroSection />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    <Route path="/rooms" element={<RoomList />} />
                    <Route path="/rooms/book/:id" element={<RoomBooking />} />
                    
                    <Route path="/services" element={<ServiceList />} />
                    <Route path="/services/book/:id" element={<ServiceBooking />} />
                    
                    {/* Panel Administratora */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/payments" element={<AdminPayments />} />
                    <Route path="/admin/reservations" element={<AdminReservations />} />
                    <Route path="/admin/guests" element={<AdminGuests />} />
                    <Route path="/admin/guests/:guestId/history" element={<GuestHistory />} />
                    <Route path="/admin/issues" element={<AdminIssues />} />
                    <Route path="/admin/reports" element={<AdminReports />} />
                    <Route path="/admin/staff" element={<AdminStaff />} />

                    {/* Panel Recepcji - Na razie przekierowuje do AdminDashboard */}
                    <Route path="/reception" element={<Navigate to="/admin" />} />

                    {/* Panel Użytkownika (Konto) */}
                    <Route path="/account" element={<UserAccount />} />
                    <Route path="/account/reservations" element={<MyReservations />} />
                    <Route path="/account/reservations/:id" element={<ReservationDetails />} />
                    <Route path="/account/services" element={<MyServices />} />
                    <Route path="/account/payments" element={<MyPayments />} />

                    {/* Domyślny fallback */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;