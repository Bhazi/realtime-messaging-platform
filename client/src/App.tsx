import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthLayout } from "./features/auth/AuthLayout";
import { LoginForm } from "./features/auth/components/LoginForm";
import { SignUpForm } from "./features/auth/components/SignUpForm";
import { MessengerLayout } from "./features/chat/MessengerLayout";
import { MessengerLayoutSkeleton } from "./features/chat/messengerLayoutSkeleton";

import { User } from "./types/types";
import { socket } from "./lib/socket";
import { userApi } from "./api/user.api";
import { authApi } from "./api/auth.api";

import "./index.css";

const HEARTBEAT_INTERVAL = 30_000;

function ProtectedRoute({
  currentUser,
  isLoadingUser,
  children,
}: {
  currentUser: User | null;
  isLoadingUser: boolean;
  children: React.ReactNode;
}) {
  if (isLoadingUser) {
    return <MessengerLayoutSkeleton />;
  }

  // User is not authenticated.
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated.
  return <>{children}</>;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  /**
   * Restore the authenticated user on application startup.
   */
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
    if (!socket) return;

    const heartbeatInterval = setInterval(() => {
      socket.emit("presence:heartbeat");
    }, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [socket]);

  useEffect(() => {
    // Don't connect if there is no authenticated user.
    if (!currentUser) {
      return;
    }

    socket.connect();

    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const handleConnectError = (error: Error) => {
      console.error("Socket connection error:", error.message);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);

      socket.disconnect();
    };
  }, [currentUser]);

  /**
   * Called after successful login/signup.
   */
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

  return (
    <BrowserRouter>
      <Routes>
        {/* =====================================================
            ROOT
            ===================================================== */}

        <Route
          path="/"
          element={
            isLoadingUser ? (
              // Optional: generic loading instead of Messenger skeleton.
              <div className="flex min-h-screen items-center justify-center">
                <div className="animate-pulse text-gray-500">Loading...</div>
              </div>
            ) : currentUser ? (
              <Navigate to="/app" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* =====================================================
            LOGIN
            ===================================================== */}

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

        {/* =====================================================
            SIGN UP
            ===================================================== */}

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

        {/* =====================================================
            MESSENGER HOME
            ===================================================== */}

        <Route
          path="/app"
          element={
            <ProtectedRoute
              currentUser={currentUser}
              isLoadingUser={isLoadingUser}
            >
              <MessengerLayout
                currentUser={currentUser!}
                onLogout={handleLogout}
                onCurrentUserChange={setCurrentUser}
              />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            MESSENGER CHAT
            ===================================================== */}

        <Route
          path="/app/chat/:conversationId"
          element={
            <ProtectedRoute
              currentUser={currentUser}
              isLoadingUser={isLoadingUser}
            >
              <MessengerLayout
                currentUser={currentUser!}
                onLogout={handleLogout}
                onCurrentUserChange={setCurrentUser}
              />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            SETTINGS
            ===================================================== */}

        <Route
          path="/app/settings"
          element={
            <ProtectedRoute
              currentUser={currentUser}
              isLoadingUser={isLoadingUser}
            >
              <MessengerLayout
                currentUser={currentUser!}
                onLogout={handleLogout}
                onCurrentUserChange={setCurrentUser}
              />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            CATCH ALL
            ===================================================== */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
