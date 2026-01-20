import React from "react";
import './styles/Global.css'
import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import Register from "./components/pages/Register.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import Home from "./components/pages/Home.jsx";
import Login from "./components/pages/Login.jsx";
import NotFound from "./components/pages/NotFound.jsx";
import PublicRoute from "./routes/PublicRoute.jsx";
import Main from "./components/pages/Main.jsx";
import {LayoutProvider} from "./components/context/LayoutContext.jsx";

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
