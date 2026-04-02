import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UploadPage from "./pages/UploadPage";
import VideoPlayerPage from "./pages/VideoPlayerPage";

function AppMain() {
  const location = useLocation();
  const isWatchRoute = /^\/videos\/[^/]+$/.test(location.pathname);
  return (
    <main
      className={`mx-auto w-full px-4 py-8 ${isWatchRoute ? "max-w-7xl" : "max-w-5xl"}`}
    >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute roles={["editor", "admin"]}>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/videos/:id"
            element={
              <ProtectedRoute>
                <VideoPlayerPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    </main>
  );
}

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <AppMain />
    </div>
  );
}

export default App;
