import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthResponse } from '../types/auth';

interface AuthContextData {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  signIn: (data: AuthResponse) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicialização preguiçosa (lazy init): só lê do localStorage no primeiro render
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('@VerzelEvents:user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      // Se os dados estiverem corrompidos no localStorage, remove e inicializa vazio.
      localStorage.removeItem('@VerzelEvents:user');
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('@VerzelEvents:token') || null;
  });

  // Autenticação válida apenas se tivermos dados do user e o token de rede presentes
  const isAuthenticated = !!user && !!token;

  // Função que atualiza o estado React E salva na memória do navegador
  function signIn(data: AuthResponse) {
    setUser(data.user);
    setToken(data.token);

    localStorage.setItem('@VerzelEvents:user', JSON.stringify(data.user));
    localStorage.setItem('@VerzelEvents:token', data.token);
  }

  function signOut() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('@VerzelEvents:user');
    localStorage.removeItem('@VerzelEvents:token');
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para evitar ter que importar o useContext e o AuthContext toda vez
export function useAuth() {
  return useContext(AuthContext);
}
