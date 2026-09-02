import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { ForgotPasswordModal } from "../../../components/ForgotPasswordModal";
import { User } from "../../../types/types";
import { authApi } from "../../../api/auth.api";

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!identifier || !password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      // Execute API Request
      const data = await authApi.login({
        identifier: identifier.trim().toLowerCase(),
        password,
      });

      // Map backend database user payload to frontend store
      const foundUser: User = {
        id: data.user.id,
        uid: data.user.uid,
        username: data.user.username,
        email: data.user.email,
        displayName: data.user.displayName,
        avatarUrl: data.user.avatarUrl,
        createdAt: data.user.createdAt,
      };

      onLoginSuccess(foundUser);
      navigate("/app");
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Asterisk Icon */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
          </svg>
        </div>
      </div>

      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Welcome to Luma
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
          A minimalist file-sharing messenger for photos, videos, and documents.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email or Username */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">
            Email or Username
          </label>
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="john@luma.app"
            className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-300">
              Password
            </label>
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-3.5 pr-10 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Navigation Link to Sign Up */}
      <div className="text-center pt-2 text-xs text-zinc-400">
        Don't have an account?{" "}
        <Link
          to="/signup"
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors hover:underline"
        >
          Sign up
        </Link>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
};
