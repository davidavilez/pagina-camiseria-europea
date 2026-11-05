import { useContext } from 'react';
import { AuthContext } from '../context/auth-context';

export default function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return contexto;
}
