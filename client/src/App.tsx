import { MessengerLayout } from "./features/chat/MessengerLayout";
import { LoginForm } from "./features/auth/components/LoginForm";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthLayout } from "./features/auth/AuthLayout";
import { SignUpForm } from "./features/auth/components/SignUpForm";
import { User } from "./types/types";
import { socket } from "./lib/socket";
import { userApi } from "./api/user.api";
import MessengerLayoutSkeleton from "./features/chat/messengerLayoutSkeleton";
import { authApi } from "./api/auth.api";
import "./index.css";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await userApi.me();

        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    socket.connect();

    const handleConnect = () => {
      console.log("✅ Socket connected:", socket.id);
    };

    const handleConnectError = (error: Error) => {
      console.error("❌ Socket connection error:", error.message);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);

      socket.disconnect();
    };
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setCurrentUser(null);
    }
  };

  // Wait for the /me API call before rendering the router.
  // This prevents currentUser === null from causing
  // an unwanted redirect to /login during the initial load.

  if (isLoadingUser) {
    return <MessengerLayoutSkeleton />;
  }

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
