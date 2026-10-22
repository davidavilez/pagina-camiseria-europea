import { useSearchParams } from 'react-router-dom';
import { ClipboardList, Package, Users } from 'lucide-react';
import InventarioTab from './InventarioTab';
import UsuariosTab from './UsuariosTab';
import AuditoriaTab from './AuditoriaTab';

const PESTANAS = [
  { id: 'inventario', etiqueta: 'Inventario', Icono: Package, Componente: InventarioTab },
  { id: 'usuarios', etiqueta: 'Usuarios', Icono: Users, Componente: UsuariosTab },
  { id: 'auditoria', etiqueta: 'Historial de cortes', Icono: ClipboardList, Componente: AuditoriaTab },
];

export default function Gerencia() {
  const [params, setParams] = useSearchParams();
  const activa = PESTANAS.find((p) => p.id === params.get('tab')) ?? PESTANAS[0];
  const { Componente } = activa;

  return (
    <main className="pagina">
      <header className="pagina-cabecera">
        <div>
          <p className="pagina-kicker">PANEL DE GERENCIA</p>
          <h1>Control de inventario</h1>
        </div>
      </header>

      <div className="tabs" role="tablist" aria-label="Secciones de gerencia">
        {PESTANAS.map(({ id, etiqueta, Icono }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activa.id === id}
            className={`tab ${activa.id === id ? 'is-active' : ''}`}
            onClick={() => setParams({ tab: id })}
          >
            <Icono size={16} /> {etiqueta}
          </button>
        ))}
      </div>

      <section role="tabpanel">
        <Componente />
      </section>
    </main>
  );
}
