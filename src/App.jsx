import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { ConfigProvider } from "antd";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Import pages
import Home from "./pages/Home";
import SignUp from "./pages/auth/SignUp";
import SignIn from "./pages/auth/SignIn";
import Pending from "./pages/auth/Pending";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Reject from "./pages/auth/Reject";

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
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<SignIn />} />
            <Route path="/home" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/pending" element={<Pending />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reject" element={<Reject />} />
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
    </ConfigProvider>
  );
}

export default App;
