import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute() {
  const token = useSelector((s) => s.auth.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
