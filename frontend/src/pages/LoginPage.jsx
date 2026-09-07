/**
 * Administrator login page.
 */

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Landmark,
  LockKeyhole,
  User,
} from "lucide-react";
import {
  useNavigate,
} from "react-router-dom";

import Button from "../components/ui/Button";
import ErrorMessage from "../components/ui/ErrorMessage";
import Input from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";


export default function LoginPage() {
  const navigate = useNavigate();

  const {
    login,
  } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);


  /**
   * Update the form field currently being edited.
   */
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }


  /**
   * Authenticate the administrator and open the dashboard.
   */
  async function handleSubmit(event) {
    event.preventDefault();

    const username = formData.username.trim();

    if (!username || !formData.password) {
      setError("Enter your username and password.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await login({
        username,
        password: formData.password,
      });

      navigate("/dashboard", {
        replace: true,
      });
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ??
        "Unable to sign in. Please try again.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-3 sm:p-5">
      <div
        className="
          mx-auto
          grid
          min-h-[calc(100vh-1.5rem)]
          max-w-7xl
          overflow-hidden
          rounded-[2rem]
          bg-white
          shadow-2xl
          sm:min-h-[calc(100vh-2.5rem)]
          lg:grid-cols-[1.05fr_0.95fr]
        "
      >
        <section
          className="
            relative
            hidden
            overflow-hidden
            bg-gradient-to-br
            from-zinc-950
            via-purple-950
            to-fuchsia-800
            p-12
            text-white
            lg:flex
            lg:flex-col
            lg:justify-between
          "
        >
          <div
            className="
              absolute
              -right-24
              -top-24
              h-80
              w-80
              rounded-full
              bg-violet-500/30
              blur-3xl
            "
          />

          <div
            className="
              absolute
              -bottom-32
              -left-20
              h-96
              w-96
              rounded-full
              bg-indigo-400/20
              blur-3xl
            "
          />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  bg-white/10
                  ring-1
                  ring-white/20
                  backdrop-blur
                "
              >
                <Landmark size={22} />
              </div>

              <div>
                <p className="text-lg font-bold">
                  Pennywise
                </p>

                <p className="text-xs text-violet-200">
                  Admin Portal
                </p>
              </div>
            </div>

            <div className="mt-24 max-w-lg">
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.25em]
                  text-violet-300
                "
              >
                Secure Banking Operations
              </p>

              <h1
                className="
                  mt-5
                  text-5xl
                  font-bold
                  leading-[1.08]
                  tracking-tight
                "
              >
                Manage banking operations with clarity.
              </h1>

              <p
                className="
                  mt-6
                  max-w-md
                  text-base
                  leading-7
                  text-slate-300
                "
              >
                A focused workspace for customer management,
                accounts, transactions, and day-to-day banking
                administration.
              </p>
            </div>
          </div>

          <div
            className="
            mt-3
              relative
              z-10
              rounded-3xl
              border
              border-white/10
              bg-white/5
              p-6
              backdrop-blur-xl
            "
          >
            <div className="flex items-start gap-4">
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-violet-400/15
                  text-violet-200
                "
              >
                <LockKeyhole size={20} />
              </div>

              <div>
                <p className="font-semibold">
                  Protected administrator access
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    leading-6
                    text-slate-300
                  "
                >
                  Authentication is required before accessing
                  customer and financial operations.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="
            flex
            items-center
            justify-center
            bg-gradient-to-br
from-white
via-fuchsia-50/30
to-rose-50/60
            px-6
            py-12
            sm:px-10
            lg:px-16
          "
        >
          <div className="w-full max-w-md">
            <div
              className="
                mb-10
                flex
                items-center
                gap-3
                lg:hidden
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-fuchsia-600
                  via-purple-600
                  to-rose-500
                  text-white
                "
              >
                <Landmark size={20} />
              </div>

              <div>
                <p className="font-bold text-slate-950">
                  Pennywise
                </p>

                <p className="text-xs text-slate-500">
                  Admin Portal
                </p>
              </div>
            </div>

            <p className="text-sm font-semibold text-violet-600">
              Welcome back
            </p>

            <h2
              className="
                mt-2
                text-3xl
                font-bold
                tracking-tight
                text-slate-950
                sm:text-4xl
              "
            >
              Sign in to your workspace
            </h2>

            <p
              className="
                mt-3
                text-sm
                leading-6
                text-slate-500
              "
            >
              Enter your administrator credentials to continue.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              <div className="relative">
                <User
                  size={17}
                  className="
                    pointer-events-none
                    absolute
                    left-4
                    top-[42px]
                    z-10
                    text-slate-400
                  "
                />

                <Input
                  id="username"
                  name="username"
                  label="Username"
                  value={formData.username}
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                  onChange={handleChange}
                  className="[&_input]:pl-11"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  Password
                  <span className="ml-1 text-rose-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={formData.password}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                    onChange={handleChange}
                    className="
                      h-11
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      pl-11
                      pr-11
                      text-sm
                      text-slate-900
                      shadow-sm
                      transition
                      duration-200
                      placeholder:text-slate-400
                      focus:border-violet-500
                      focus:ring-4
                      focus:ring-violet-500/10
                    "
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() => {
                      setShowPassword(
                        (current) => !current
                      );
                    }}
                    className="
                      absolute
                      right-3
                      top-1/2
                      flex
                      h-8
                      w-8
                      -translate-y-1/2
                      items-center
                      justify-center
                      rounded-lg
                      text-slate-400
                      transition
                      hover:bg-slate-100
                      hover:text-slate-700
                      focus-visible:ring-2
                      focus-visible:ring-violet-500
                    "
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <ErrorMessage message={error} />

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full"
              >
                {submitting
                  ? "Signing in..."
                  : "Sign In"}
              </Button>
            </form>

            <p
              className="
                mt-8
                text-center
                text-xs
                leading-5
                text-slate-400
              "
            >
              Authorized administrators only. Access to banking
              operations is monitored and protected.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}