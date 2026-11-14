import { createContext, useContext, useEffect, useState } from "react";
import {
  inscrireUtilisateur,
  connecterUtilisateur,
  obtenirProfil,
} from "../api/auth";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getAccessToken()));

  useEffect(() => {
    let actif = true;

    async function verifierSession() {
      const token = getAccessToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profil = await obtenirProfil();

        if (actif) {
          setUser(profil);
        }
      } catch (error) {
        if (error.status === 401) {
          clearAccessToken();
        }
        if (actif) {
          setUser(null);
        }
      } finally {
        if (actif) {
          setLoading(false);
        }
      }
    }

    verifierSession();

    return () => {
      actif = false;
    };
  }, []);

  async function enregistrerSession(reponse) {
    setAccessToken(reponse.access_token);
    setUser(reponse.user);
    return reponse.user;
  }

  async function login(donnees) {
    const reponse = await connecterUtilisateur(donnees);
    return enregistrerSession(reponse);
  }

  async function register(donnees) {
    const reponse = await inscrireUtilisateur(donnees);
    return enregistrerSession(reponse);
  }

  function logout() {
    clearAccessToken();
    setUser(null);
  }

  async function refreshProfile() {
    const profil = await obtenirProfil();
    setUser(profil);
    return profil;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider.");
  }

  return context;
}
