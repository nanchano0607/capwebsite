import { createContext } from "react";

export type User = { id?: number; email?: string | null; name?: string | null } | null;

export const AuthCtx = createContext<{
  user: User;
  loading: boolean;
  refresh: () => void;
  setUser: (u: User) => void; // ← setUser 추가
}>({
  user: null,
  loading: true,
  refresh: () => {},
  setUser: () => {}, // ← setUser 기본값 추가
});