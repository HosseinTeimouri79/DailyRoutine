import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import { getToken } from "./lib/api";
import { SettingsProvider, useSettings } from "./lib/settings";
const transitionBaseClasses =
  "transition-[opacity,transform,filter] duration-[240ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]";

const transitionHiddenByMode = {
  fade: "translate-y-[10px]",
  slide: "translate-x-[12px]",
  zoom: "scale-[0.98]",
  sparkle: "translate-y-[10px] scale-[0.98]",
  swirl: "-rotate-[4deg] scale-[0.96]",
  blur: "scale-[1.01] blur-[6px]",
  tilt: "translate-y-[8px] rotate-[2deg]",
  flip: "[transform:perspective(600px)_rotateX(6deg)_translateY(10px)]",
  skew: "translate-y-[8px] skew-y-[2deg]",
};

function getPageTransitionClasses(mode, isVisible) {
  const hiddenClass = transitionHiddenByMode[mode] || transitionHiddenByMode.fade;
  const modeBase = mode === "flip" ? "origin-center" : "";
  const visibilityClass = isVisible
    ? "opacity-100 filter-none"
    : `opacity-0 ${hiddenClass}`;

  return [transitionBaseClasses, modeBase, visibilityClass]
    .filter(Boolean)
    .join(" ");
}

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
      className={getPageTransitionClasses(
        pageTransitionSettings.mode,
        isPageVisible,
      )}
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
