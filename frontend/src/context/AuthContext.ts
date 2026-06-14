import { createContext, useContext } from "react";
import { type User } from "firebase/auth";

export interface AuthContextType {
  user: User | null;
  token: ***ENTFERNT*** | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: ***ENTFERNT***
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}
