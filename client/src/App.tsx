import { MessengerLayout } from "./features/chat/MessengerLayout";
import { messengerStore } from "./messangerStore/messengerStore";
import { LoginForm } from "./features/auth/components/LoginForm";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthLayout } from "./features/auth/AuthLayout";
import { SignUpForm } from "./features/auth/components/SignUpForm";
import { User } from "./types/types";
import "./index.css";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return messengerStore.getCurrentUser();
  });

  console.log("App : in the app component at the top");

  const handleLoginSuccess = (user: User) => {
    console.log(
      "i am from the handlelogin success function inside the app component",
    );
    console.log(currentUser); // old value
    setCurrentUser(user);
    console.log(currentUser); // old value
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

        {/* Login Page */}
        <Route
          path="/login"
          element={
            <AuthLayout
              taglineHeader="You can easily"
              taglineTitle="Start connecting Your people, your conversations, your space"
            >
              <LoginForm onLoginSuccess={handleLoginSuccess} />
            </AuthLayout>
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

        {/* Main Messenger Routes */}
        <Route
          path="/app"
          element={
            currentUser ? (
              <MessengerLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                onCurrentUserChange={setCurrentUser}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/app/chat/:conversationId"
          element={
            currentUser ? (
              <MessengerLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                onCurrentUserChange={setCurrentUser}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/app/settings"
          element={
            currentUser ? (
              <MessengerLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                onCurrentUserChange={setCurrentUser}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
