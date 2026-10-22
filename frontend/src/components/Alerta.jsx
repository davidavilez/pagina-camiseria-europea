import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Alerta({ tipo = 'error', children }) {
  if (!children) return null;
  const Icono = tipo === 'exito' ? CheckCircle2 : AlertCircle;
  return (
    <p className={`alerta alerta--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icono size={16} /> <span>{children}</span>
    </p>
  );
}
