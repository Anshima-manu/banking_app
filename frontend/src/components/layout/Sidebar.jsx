/**
 * Main navigation sidebar for the banking admin portal.
 */

import {
  ArrowLeftRight,
  FileBarChart,
  LayoutDashboard,
  Landmark,
  LogOut,
  Users,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";


const navigationItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Customers",
    path: "/customers",
    icon: Users,
  },
  {
    label: "Transactions",
    path: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Reports",
    path: "/reports",
    icon: FileBarChart,
  }
];


export default function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();


  function handleLogout() {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }


  return (
    <aside
      className="
        fixed
        inset-y-0
        left-0
        z-40
        hidden
        w-64
        flex-col
        overflow-hidden
        bg-gradient-to-b
        from-zinc-950
        via-purple-950
        to-fuchsia-950
        text-white
        lg:flex
      "
    >
      <div
        className="
          absolute
          -left-24
          top-28
          h-56
          w-56
          rounded-full
          bg-fushsia-500/10
          blur-3xl
        "
      />

      <div
        className="
          absolute
          -bottom-20
          -right-20
          h-64
          w-64
          rounded-full
          bg-rose-400/10
          blur-3xl
        "
      />

      <div
        className="
          relative
          z-10
          flex
          items-center
          gap-3
          px-6
          py-7
        "
      >
        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-2xl
            bg-gradient-to-br
            from-fushsia-500
            via-purple-500
            to-rose-600
            shadow-lg
            shadow-fushsia-950/40
          "
        >
          <Landmark size={22} />
        </div>

        <div>
          <p
            className="
              text-lg
              font-bold
              tracking-tight
            "
          >
            Pennywise
          </p>

          <p
            className="
              text-xs
              text-fushsia-300
            "
          >
            Admin Portal
          </p>
        </div>
      </div>

      <div
        className="
          relative
          z-10
          mx-6
          border-t
          border-white/10
        "
      />

      <nav
        className="
          relative
          z-10
          flex-1
          space-y-2
          px-4
          py-6
        "
      >
        <p
          className="
            mb-3
            px-3
            text-[11px]
            font-semibold
            uppercase
            tracking-[0.18em]
            text-slate-500
          "
        >
          Workspace
        </p>

        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3",
                  "rounded-xl px-3 py-3",
                  "text-sm font-medium",
                  "transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-fuchsia-500/15 via-purple-500/10 to-rose-500/10 text-white shadow-sm ring-1 ring-fuchsia-300/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      transition
                      ${
                        isActive
                          ? "bg-gradient-to-br from-fuchsia-500 via-purple-500 to-rose-500 text-white shadow-md shadow-fushsia-950/30"
                          : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white"
                      }
                    `}
                  >
                    <Icon size={18} />
                  </div>

                  <span>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div
        className="
          relative
          z-10
          border-t
          border-white/10
          p-4
        "
      >
        <button
          type="button"
          onClick={handleLogout}
          className="
            flex
            w-full
            items-center
            gap-3
            rounded-xl
            px-3
            py-3
            text-sm
            font-medium
            text-slate-400
            transition
            hover:bg-rose-500/10
            hover:text-rose-300
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-white/5
            "
          >
            <LogOut size={18} />
          </div>

          <span>
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}