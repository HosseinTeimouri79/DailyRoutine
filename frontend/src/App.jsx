import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import { getToken } from "./lib/api";
import { SettingsProvider, useSettings } from "./lib/settings";
import "./App.css";

function ProtectedRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const location = useLocation();
  const { pageTransitionSettings } = useSettings();
  const [isPageVisible, setIsPageVisible] = useState(true);

  useEffect(() => {
    if (!pageTransitionSettings.enabled) {
      setIsPageVisible(true);
      return;
    }

    setIsPageVisible(false);
    const timeoutId = window.setTimeout(() => {
      setIsPageVisible(true);
    }, 40);

    return () => window.clearTimeout(timeoutId);
  }, [location.key, pageTransitionSettings.enabled]);

  return (
    <div
      className={`page-transition page-transition-${pageTransitionSettings.mode} ${
        isPageVisible ? "page-transition-visible" : "page-transition-hidden"
      }`}
    >
      <Routes location={location}>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppRoutes />
    </SettingsProvider>
  );
}
