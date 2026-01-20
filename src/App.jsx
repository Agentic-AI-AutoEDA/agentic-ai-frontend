import React from "react";
import './styles/Global.css'
import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import Register from "./pages/Register.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import PublicRoute from "./components/PublicRoute.jsx";

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>}/>
        <Route path="/register" element={<PublicRoute><RegisterAndLogout /></PublicRoute>}/>
        <Route path='/logout' element={<Logout />} />
        <Route path='*' element={<NotFound />} />
        <Route path='/' element={<ProtectedRoute><Home /></ProtectedRoute>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
