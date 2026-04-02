import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm transition ${
    isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
  }`;

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const canUpload = user?.role === "editor" || user?.role === "admin";
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="text-lg font-semibold tracking-tight text-zinc-900">
          Pulse
        </Link>
        <nav className="flex items-center gap-1">
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className={navClass}>
                Dashboard
              </NavLink>
              {canUpload ? (
                <NavLink
                  to="/upload"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all shadow-sm ${
                      isActive
                        ? "bg-indigo-700 text-white"
                        : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 hover:shadow-md hover:-translate-y-0.5"
                    }`
                  }
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload
                </NavLink>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={navClass}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
