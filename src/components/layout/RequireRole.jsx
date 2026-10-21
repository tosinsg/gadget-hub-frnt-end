import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Route protection for the seller and admin areas.
 *
 * <b>This is a convenience, not a security control.</b> It stops a signed-in buyer from
 * landing on a dashboard that would only show them errors, which is a better experience than
 * a broken page. It protects nothing: anyone can edit the JavaScript, or simply call the API
 * directly. Every `/api/seller/**` and `/api/admin/**` request is authorised again on the
 * server, and that is the check that actually matters.
 *
 * While the stored session is being re-checked against the server (`checking`), this renders
 * a placeholder rather than redirecting - otherwise a page refresh would bounce a legitimate
 * seller to the login screen for a fraction of a second.
 */
const RequireRole = ({ roles, children }) => {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0B0F10] flex items-center justify-center">
        <p className="text-[#8B9494] text-sm" role="status">
          Checking your session…
        </p>
      </div>
    );
  }

  if (!user) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireRole;
