import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollManager from "./components/ScrollManager";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Accueil from "./pages/Accueil";
import Connexion from "./pages/Connexion";
import EspaceUsager from "./pages/EspaceUsager";
import EspaceAgent from "./pages/EspaceAgent";
import EspaceAdmin from "./pages/EspaceAdmin";
import GestionServices from "./pages/GestionServices";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollManager />
        <Navbar />
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/connexion" element={<Connexion />} />

          <Route
            path="/usager"
            element={
              <ProtectedRoute roles={["USER"]}>
                <EspaceUsager />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent"
            element={
              <ProtectedRoute roles={["AGENT", "ADMIN"]}>
                <EspaceAgent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <EspaceAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/services"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <GestionServices />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
