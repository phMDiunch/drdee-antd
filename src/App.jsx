import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { ConfigProvider } from "antd";
import { App as AntdApp } from "antd";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Import contexts
import { AuthProvider } from "./contexts/AuthContext";

// Import components
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

// Import pages
import Home from "./pages/Home";
import SignUp from "./features/auth/pages/SignUp";
import SignIn from "./features/auth/pages/SignIn";
import Pending from "./features/auth/pages/Pending";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import Reject from "./features/auth/pages/Reject";
import UserList from "./features/users/pages/UserList";
import UserDetail from "./features/users/pages/UserDetail";

import LeadList from "./features/leads/pages/LeadList";
import LeadCreate from "./features/leads/pages/LeadCreate";
import LeadEdit from "./features/leads/pages/LeadEdit";

// Import layout
import AppLayout from "./layouts/AppLayout";


function App() {
  return (
    <AntdApp>
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
                  <Route path="users/edit/:id" element={<UserDetail />} />
                  <Route path="users/new" element={<UserDetail />} />

                  <Route path="leads" element={<LeadList />} />
                  <Route path="leads/create" element={<LeadCreate />} />
                  <Route path="leads/:id/edit" element={<LeadEdit />} />
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
    </AntdApp>
  );
}

export default App;
