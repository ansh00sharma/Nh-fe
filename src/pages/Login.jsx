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
    <main className="login-screen flex min-h-screen items-center justify-center overflow-hidden px-5 py-8 text-slate-950 sm:px-8">
      <section className="login-shell grid w-full max-w-xl overflow-hidden border border-white/70 bg-white shadow-2xl shadow-slate-200/80 lg:max-w-5xl lg:grid-cols-[1.08fr_0.92fr]">
        <aside className="login-visual hidden min-h-[620px] flex-col justify-between bg-slate-950 p-10 text-white lg:flex">
          <div className="relative z-10">
            <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-cyan-50 backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_24px_rgba(110,231,183,0.85)]" />
              Live operations workspace
            </div>

            <h2 className="max-w-md text-5xl font-semibold leading-tight tracking-normal">
              Move work from planned to done with clarity.
            </h2>
            <p className="mt-5 max-w-sm text-base leading-7 text-slate-300">
              TaskFlow keeps projects, ownership, and deadlines in one focused view for faster daily decisions.
            </p>
          </div>

          <div className="login-preview relative z-10 rounded border border-white/10 bg-white/10 p-5 shadow-2xl shadow-cyan-950/40 backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Today</p>
                <p className="mt-1 text-2xl font-semibold">12 active tasks</p>
              </div>
              <div className="rounded bg-emerald-300/15 px-3 py-1 text-sm font-semibold text-emerald-200">
                +18%
              </div>
            </div>

            <div className="space-y-3">
              {[
                ["Finalize sprint board", "Design", "w-10/12", "bg-cyan-300"],
                ["Review API contracts", "Backend", "w-8/12", "bg-amber-300"],
                ["Prepare launch notes", "Ops", "w-6/12", "bg-emerald-300"],
              ].map(([title, team, widthClass, colorClass], index) => (
                <div
                  className="login-task-row rounded border border-white/10 bg-slate-950/45 p-4"
                  key={title}
                  style={{ animationDelay: `${180 + index * 90}ms` }}
                >
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold">{title}</p>
                    <span className="rounded bg-white/10 px-2 py-1 text-xs font-medium text-slate-300">
                      {team}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className={`h-2 rounded-full ${colorClass} ${widthClass}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="login-panel flex min-h-[620px] items-center bg-white px-6 py-10 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-9">
              <div className="mb-7 flex h-12 w-12 items-center justify-center rounded bg-slate-950 text-lg font-bold text-white shadow-lg shadow-slate-300">
                TF
              </div>
              <p className="mb-3 text-sm font-semibold uppercase text-cyan-700">
                Welcome back
              </p>
              <h1 className="text-4xl font-semibold tracking-normal text-slate-950">Sign in to TaskFlow</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your credentials to access projects, teams, and task updates.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="username">
                  Username
                </label>
                <div className="flex items-center gap-3 rounded border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-cyan-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-100">
                  <span aria-hidden="true" className="text-sm font-semibold text-slate-400">
                    @
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="block min-h-12 w-full bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
                    placeholder="Enter username"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                    Password
                  </label>
                  <span className="text-xs font-medium text-slate-400">Secure access</span>
                </div>
                <div className="flex items-center gap-3 rounded border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-cyan-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-100">
                  <span aria-hidden="true" className="text-base font-semibold text-slate-400">
                    ***
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="block min-h-12 w-full bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <p className="min-h-5 text-sm font-medium text-red-600" role="alert">
                {error}
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="login-submit flex min-h-12 w-full items-center justify-center gap-2 rounded bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-cyan-700 hover:shadow-cyan-900/20 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-slate-400 disabled:shadow-none"
              >
                <span>{isSubmitting ? "Signing in..." : "Sign in"}</span>
                {!isSubmitting && (
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12h14m-6-6 6 6-6 6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </button>
            </form>

            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-slate-100 pt-6">
              {["Projects", "Tasks", "Teams"].map((item) => (
                <div
                  className="rounded bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-500"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;
