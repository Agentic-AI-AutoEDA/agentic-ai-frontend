import React from "react";
import './styles/Global.css'
import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import Register from "./pages/Register.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import PublicRoute from "./routes/PublicRoute.jsx";
import Main from "./pages/Main.jsx";
import {LayoutProvider} from "./context/LayoutContext.jsx";

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
      <LayoutProvider>
        <Routes>
          <Route path="/" element={<PublicRoute><Main /></PublicRoute>}/>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>}/>
          <Route path="/register" element={<PublicRoute><RegisterAndLogout /></PublicRoute>}/>
          <Route path='/logout' element={<Logout />} />
          <Route path='*' element={<NotFound />} />
          <Route path='/home' element={<ProtectedRoute><Home /></ProtectedRoute>}/>
        </Routes>
      </LayoutProvider>
    </BrowserRouter>
  )
}

export default App
