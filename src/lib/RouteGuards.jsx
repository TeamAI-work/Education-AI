import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthSessionUser, getStoredUserId } from './auth';

function useAuthStatus() {
    const [status, setStatus] = useState({ checking: true, signedIn: false });

    useEffect(() => {
        let cancelled = false;

        const checkAuth = async () => {
            const localUserId = getStoredUserId();
            if (localUserId) {
                if (!cancelled) {
                    setStatus({ checking: false, signedIn: true });
                }
                return;
            }

            const authUser = await getAuthSessionUser();
            if (cancelled) return;

            if (authUser?.id) {
                localStorage.setItem('edu_ai_user_id', authUser.id);
                setStatus({ checking: false, signedIn: true });
            } else {
                setStatus({ checking: false, signedIn: false });
            }
        };

        checkAuth();
        return () => {
            cancelled = true;
        };
    }, []);

    return status;
}

export function ProtectedRoute({ children }) {
    const { checking, signedIn } = useAuthStatus();
    const location = useLocation();

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] text-white">
                <span className="text-sm tracking-wide">Checking authentication...</span>
            </div>
        );
    }

    return signedIn ? children : <Navigate to="/auth" state={{ from: location.pathname }} replace />;
}

export function PublicRoute({ children }) {
    const { checking, signedIn } = useAuthStatus();
    const location = useLocation();

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] text-white">
                <span className="text-sm tracking-wide">Checking authentication...</span>
            </div>
        );
    }

    const destination = location.state?.from || '/level2';
    return signedIn ? <Navigate to={destination} replace /> : children;
}
