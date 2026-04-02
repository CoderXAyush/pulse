import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { loginUser, googleLogin as googleLoginService } from "../services/authService";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const targetPath = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await loginUser(form);
      login(data.token, data.user);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const data = await googleLoginService(credentialResponse.credential);
      login(data.token, data.user);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In was unsuccessful. Please try again.");
  };

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Login</h1>
      <p className="mt-1 text-sm text-zinc-500">Access your video workspace.</p>

      {/* Google Sign-In */}
      <div className="mt-6 flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          size="large"
          width="100%"
          theme="outline"
          text="signin_with"
          shape="pill"
        />
      </div>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-200" />
        <span className="text-xs font-medium text-zinc-400">OR</span>
        <div className="h-px flex-1 bg-zinc-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-400"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          required
        />
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-400"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          required
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          disabled={loading}
          className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-zinc-500">
        No account?{" "}
        <Link to="/register" className="text-zinc-900 underline underline-offset-2">
          Register
        </Link>
      </p>
    </section>
  );
}
