import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollManager from "./components/ScrollManager";
import Accueil from "./pages/Accueil";
import EspaceUsager from "./pages/EspaceUsager";
import EspaceAgent from "./pages/EspaceAgent";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <Navbar />
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/usager" element={<EspaceUsager />} />
        <Route path="/agent" element={<EspaceAgent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
