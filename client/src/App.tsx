// import { MessengerLayout } from "./components/MessengerLayout";
import { messengerStore } from "./messangerStore/messengerStore";
// import { LoginForm } from "./components/LoginForm";
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthLayout } from "./features/auth/AuthLayout";
import { SignUpForm } from "./features/auth/components/SignUpForm";
import { User } from "./types/types";
import "./index.css";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return messengerStore.getCurrentUser();
  });

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("luma_user");
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect Root */}
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate to="/app" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Signup Page */}
        <Route
          path="/signup"
          element={
            <AuthLayout
              taglineHeader="Start your journey"
              taglineTitle="Start connecting Your people, your conversations, your space"
            >
              <SignUpForm onSignUpSuccess={handleLoginSuccess} />
            </AuthLayout>
          }
        />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
