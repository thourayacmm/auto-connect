import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <div className="min-h-screen bg-hero-glow px-4 py-10">
      <Outlet />
    </div>
  );
}

export default AuthLayout;
