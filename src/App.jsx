import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { ConfigProvider } from "antd";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Import contexts
import { AuthProvider } from "./contexts/AuthContext";

// Import components
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

// Import pages
import Home from "./pages/Home";
import SignUp from "./pages/auth/SignUp";
import SignIn from "./pages/auth/SignIn";
import Pending from "./pages/auth/Pending";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Reject from "./pages/auth/Reject";
import UserList from "./pages/users/UserList";
import UserEdit from "./pages/users/UserEdit";

// Import layout
import AppLayout from "./layouts/AppLayout";

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#00b4aa",
          borderRadius: 8,
        },
      }}
    >
      <AuthProvider>
        <Router>
          <div className="app">
            <Routes>
              {/* Các route public KHÔNG dùng layout */}
              <Route path="/" element={
                <PublicRoute><SignIn /></PublicRoute>
              } />
              <Route path="/signin" element={
                <PublicRoute><SignIn /></PublicRoute>
              } />
              <Route path="/signup" element={
                <PublicRoute><SignUp /></PublicRoute>
              } />
              <Route path="/forgot-password" element={
                <PublicRoute><ForgotPassword /></PublicRoute>
              } />
              <Route path="/pending" element={<Pending />} />
              <Route path="/reject" element={<Reject />} />

              {/* Route nội bộ - DÙNG layout */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="home" element={<Home />} />
                <Route path="users" element={<UserList />} />
                <Route path="users/edit/:id" element={<UserEdit />} />
                <Route path="users/new" element={<UserEdit />} />
                {/* Thêm các route nội bộ khác tại đây */}
              </Route>
            </Routes>
          </div>

          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
