import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getUser } from "../../lib/api";
import Button from "../ui/Button";

const links = [
  { to: "/", label: "داشبورد" },
  { to: "/calendar", label: "تقویم" },
  { to: "/reports", label: "گزارش‌ها" },
];

export default function AppShell({ title, children }) {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell" dir="rtl">
      <header className="topbar">
        <div>
          <h1>{title}</h1>
          <p>{user ? `سلام ${user.name}` : ""}</p>
        </div>
        <Button variant="secondary" onClick={logout}>
          خروج
        </Button>
      </header>

      <nav className="nav-tabs">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={location.pathname === link.to ? "tab active" : "tab"}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <main className="content-grid">{children}</main>
    </div>
  );
}
