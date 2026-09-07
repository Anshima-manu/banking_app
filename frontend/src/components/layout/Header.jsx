import {
  Bell,
  ChevronDown,
  LogOut,
  Search,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";


export default function Header() {
  const navigate = useNavigate();

  const {
    admin,
    logout,
  } = useAuth();

  const profileRef = useRef(null);

  const [searchValue, setSearchValue] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);


  const displayName =
    admin?.username || "Administrator";

  const email =
    admin?.email || "No email available";

  const initial =
    displayName.charAt(0).toUpperCase();


  function handleSearch(event) {
    event.preventDefault();

    const value = searchValue.trim();

    if (!value) {
      navigate("/customers");
      return;
    }

    const encodedValue =
      encodeURIComponent(value);

    navigate(
      `/customers?search=${encodedValue}`
    );
  }


  function handleSearchChange(event) {
    setSearchValue(event.target.value);
  }


  function toggleProfile() {
    setProfileOpen((current) => !current);
  }


  function handleLogout() {
    setProfileOpen(false);

    logout();

    navigate("/login");
  }


  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);


  return (
    <header
      className="
        sticky
        top-0
        z-30
        border-b
        border-slate-200/70
       bg-gradient-to-r
        from-white
        via-fuchsia-50/40
        to-rose-50/50
        backdrop-blur-xl
      "
    >
      <div
        className="
          flex
          h-20
          items-center
          justify-between
          gap-6
          px-8
        "
      >
        <form
          onSubmit={handleSearch}
          className="relative"
        >
          <Search
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
            type="search"
            value={searchValue}
            placeholder="Search customers..."
            aria-label="Search customers"
            onChange={handleSearchChange}
            className="
              h-11
              w-80
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              pl-11
              pr-4
              text-sm
              text-slate-900
              transition
              placeholder:text-slate-400
              focus:border-fuchsia-500
              focus:ring-4
              focus:ring-fuchsia-500/10
              focus:bg-white
            "
          />
        </form>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="
              relative
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-white
              text-slate-500
              transition
              hover:border-fuchsia-200
hover:bg-fuchsia-50
hover:text-fuchsia-700
            "
          >
            <Bell size={18} />

            <span
              className="
                absolute
                right-2
                top-2
                h-2
                w-2
                rounded-full
                bg-rose-500
                ring-2
                ring-white
              "
            />
          </button>

          <div className="h-8 w-px bg-slate-200" />

          <div
            ref={profileRef}
            className="relative"
          >
            <button
              type="button"
              aria-expanded={profileOpen}
              onClick={toggleProfile}
              className="
                flex
                items-center
                gap-3
                rounded-xl
                px-2
                py-1.5
                text-left
                transition
                hover:bg-pink-100
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-br
from-fuchsia-600
via-purple-600
to-rose-500
                  text-sm
                  font-bold
                  text-white
                  shadow-md
                  shadow-fuchsia-500/25
                "
              >
                {initial}
              </div>

              <div>
                <p
                  className="
                    max-w-40
                    truncate
                    text-sm
                    font-semibold
                    text-slate-900
                  "
                >
                  {displayName}
                </p>

                <p className="text-xs text-slate-500">
                  Administrator
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`
                  text-slate-400
                  transition-transform
                  duration-200
                  ${
                    profileOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </button>

            {profileOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-[calc(100%+0.75rem)]
                  w-72
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-xl
                  shadow-slate-900/10
                "
              >
                <div
                  className="
                    bg-gradient-to-br
                    from-zinc-950
                    via-purple-950
                    to-fuchsia-900
                    px-5
                    py-5
                    text-white
                  "
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-xl
                        bg-white/10
                        font-bold
                        ring-1
                        ring-white/15
                      "
                    >
                      {initial}
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          truncate
                          text-sm
                          font-semibold
                        "
                      >
                        {displayName}
                      </p>

                      <p
                        className="
                          mt-0.5
                          truncate
                          text-xs
                          text-slate-300
                        "
                      >
                        {email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
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
                        bg-fuchsia-50
text-fuchsia-700
                      "
                    >
                      <UserRound size={17} />
                    </div>

                    <div>
                      <p
                        className="
                          text-sm
                          font-medium
                          text-slate-800
                        "
                      >
                        Admin Account
                      </p>

                      <p
                        className="
                          text-xs
                          text-slate-400
                        "
                      >
                        {admin?.admin_status || "ACTIVE"}
                      </p>
                    </div>
                  </div>

                  <div
                    className="
                      my-2
                      border-t
                      border-slate-100
                    "
                  />

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
                      text-left
                      text-sm
                      font-medium
                      text-rose-600
                      transition
                      hover:bg-rose-50
                      hover:text-rose-700
                    "
                  >
                    <LogOut size={17} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}