import { useNavigate, useLocation, Navigate } from "react-router-dom";
import React from 'react';

export const useAuth = () => {
    const navigate = useNavigate();
    // Using localStorage for mock auth temporarily
    // In a real app, you'd use a context or state management library
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const login = (role: string, name: string) => {
        const mockUser = { id: 1, role, name };
        localStorage.setItem("user", JSON.stringify(mockUser));
        navigate("/dashboard");
    };

    const logout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    return { user, login, logout, isAuthenticated: !!user };
};

import RestrictedPage from "../pages/error/RestrictedPage";

export const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <RestrictedPage />;
    }

    return <>{children}</>;
};
