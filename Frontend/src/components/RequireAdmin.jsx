// src/components/RequireAdmin.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
  const adminToken = localStorage.getItem("adminToken");

  if (!adminToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
