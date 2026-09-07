import {
  LayoutDashboard,
  Landmark,
  LogOut,
  Users,
  X,
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
];


export default function MobileSidebar({
  open,
  onClose,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();


  function handleLogout() {
    logout();
    onClose();

    navigate("/login", {
      replace: true,
    });
  }


  if (!open) {
    return null;
  }


  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="
          absolute
          inset-0
          bg-slate-950/60
          backdrop-blur-sm
        "
      />

      <aside
        className="
          relative
          z-10
          flex
          h-full
          w-72
          max-w-[85vw]
          flex-col
          overflow-hidden
          bg-gradient-to-b
          from-slate-950
          via-indigo-950
          to-violet-950
          text-white
          shadow-2xl
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            px-5
            py-6
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-gradient-to-br
                from-violet-500
                to-indigo-600
              "
            >
              <Landmark size={20} />
            </div>

            <div>
              <p className="font-bold">
                BankFlow
              </p>

              <p className="text-xs text-violet-300">
                Admin Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-white/5
              text-slate-300
              transition
              hover:bg-white/10
              hover:text-white
            "
          >
            <X size={19} />
          </button>
        </div>

        <div className="mx-5 border-t border-white/10" />

        <nav className="flex-1 space-y-2 px-4 py-6">
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
                onClick={onClose}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-xl px-3 py-3",
                    "text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white/10 text-white ring-1 ring-white/10"
                      : "text-slate-400 hover:bg-white/5 hover:text-white",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={[
                        "flex h-9 w-9 items-center justify-center rounded-xl",
                        isActive
                          ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
                          : "bg-white/5 text-slate-400",
                      ].join(" ")}
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

        <div className="border-t border-white/10 p-4">
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
    </div>
  );
}