import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  fetchCurrentUser,
  getAccessToken,
  getDefaultAuthenticatedPath,
  login,
  saveAuthSession,
} from "../api/auth.js";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultAuthenticatedPath = getDefaultAuthenticatedPath();

  if (getAccessToken() && defaultAuthenticatedPath !== "/login") {
    return <Navigate to={defaultAuthenticatedPath} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setError("Username and password are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { accessToken, refreshToken } = await login({
        username: trimmedUsername,
        password,
      });
      const user = await fetchCurrentUser(accessToken);

      saveAuthSession({ accessToken, refreshToken, user });
      navigate(getDefaultAuthenticatedPath(user), { replace: true });
    } catch (loginError) {
      setError(loginError.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
      <section className="w-full max-w-sm rounded border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold">TaskFlow</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to continue</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="block w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="block w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <p className="min-h-5 text-sm text-red-600" role="alert">
            {error}
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;
