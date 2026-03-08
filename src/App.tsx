import { Link, Route, Routes, useLocation } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { AdminPage } from "./pages/AdminPage";

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname === "/admin";

  return (
    <>
      {isAdminRoute && (
        <div className="topbar shell">
          <Link to="/">На главную</Link>
        </div>
      )}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </>
  );
}

export default App;
