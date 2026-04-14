import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Availability from './pages/Availability';
import Bookings from './pages/Bookings';
import Schedules from './pages/Schedules';
import BookingPage from './pages/BookingPage';
import ReschedulePage from './pages/ReschedulePage';
import Layout from './components/Layout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} />
      <Routes>
        {/* Admin Dashboard Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="availability" element={<Availability />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="bookings" element={<Bookings />} />
        </Route>

        {/* Public Pages */}
        <Route path="/:username/:slug" element={<BookingPage />} />
        <Route path="/reschedule/:id" element={<ReschedulePage />} />
      </Routes>
    </Router>
  );
}

export default App;
