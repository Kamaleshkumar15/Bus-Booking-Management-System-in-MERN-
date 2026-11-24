import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PolicyPage from './pages/PolicyPage';
import NotFoundPage from './pages/NotFoundPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import SearchResultsPage from './pages/SearchResultsPage';
import BusDetailsPage from './pages/BusDetailsPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import PassengerDetailsPage from './pages/PassengerDetailsPage';
import PaymentPage from './pages/PaymentPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import UserDashboardPage from './pages/UserDashboardPage';
import UserBookingHistoryPage from './pages/UserBookingHistoryPage';
import DriverLoginPage from './pages/DriverLoginPage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import DriverPassengerDetailsPage from './pages/DriverPassengerDetailsPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route
                path="/terms"
                element={
                  <PolicyPage
                    title="Terms and Conditions"
                    sections={[
                      { heading: '1. Local Demo Platform', body: 'This application operates locally with JSON persistence and simulated payments.' },
                      { heading: '2. Ticket Validity', body: 'Passengers must carry a valid photo ID matching the passenger manifest.' },
                    ]}
                  />
                }
              />
              <Route
                path="/privacy"
                element={
                  <PolicyPage
                    title="Privacy Policy"
                    sections={[
                      { heading: '1. Local Storage', body: 'All user and booking records are stored locally in server/database/*.json.' },
                      { heading: '2. Payment Credentials', body: 'No real card numbers, CVVs, or banking credentials are collected or stored.' },
                    ]}
                  />
                }
              />
              <Route
                path="/cancellation-policy"
                element={
                  <PolicyPage
                    title="Cancellation & Refund Policy"
                    sections={[
                      { heading: '1. Eligible Cancellations', body: 'Confirmed bookings can be cancelled any time before the trip is marked In Progress or Completed.' },
                      { heading: '2. Demo Refunds', body: 'Cancelling a paid booking creates a local refund request for Admin approval and releases seats immediately.' },
                    ]}
                  />
                }
              />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/buses/:id" element={<BusDetailsPage />} />
              <Route path="/trips/:tripId/seats" element={<SeatSelectionPage />} />
              <Route path="/driver/login" element={<DriverLoginPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />

              <Route
                path="/booking/passengers"
                element={
                  <ProtectedRoute allowedRoles={['user', 'admin']}>
                    <PassengerDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/payment"
                element={
                  <ProtectedRoute allowedRoles={['user', 'admin']}>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/confirmation/:bookingId"
                element={
                  <ProtectedRoute allowedRoles={['user', 'admin']}>
                    <BookingConfirmationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['user', 'admin']}>
                    <UserDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute allowedRoles={['user', 'admin']}>
                    <UserBookingHistoryPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/driver/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <DriverDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver/trips/:tripId/passengers"
                element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <DriverPassengerDetailsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </BookingProvider>
    </AuthProvider>
  );
}
