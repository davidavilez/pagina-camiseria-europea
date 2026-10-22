import { useState } from 'react';
import { Plus } from 'lucide-react';
import usePolling from '../../hooks/usePolling';
import { listarUsuarios } from '../../api/usuarios.api';
import IndicadorEnVivo from '../../components/IndicadorEnVivo';
import NuevoUsuarioModal from './NuevoUsuarioModal';
import { formatearFecha } from '../../utils/formato';

export default function UsuariosTab() {
  const { datos: usuarios, error, cargando, ultimaActualizacion, recargar } = usePolling(listarUsuarios);
  const [creando, setCreando] = useState(false);

  return (
    <>
      <div className="barra-herramientas">
        <p className="barra-titulo">{usuarios ? `${usuarios.length} usuarios registrados` : 'Usuarios'}</p>
        <IndicadorEnVivo ultimaActualizacion={ultimaActualizacion} error={error} />
        <button type="button" className="btn btn--primario" onClick={() => setCreando(true)} aria-label="Crear usuario">
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {cargando ? <p className="vacio">Cargando usuarios...</p> : (
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {(usuarios ?? []).map((u) => (
                <tr key={u.id}>
                  <td className="fuerte">{u.nombre}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge badge--rol-${u.rol}`}>{u.rol === 'gerencia' ? 'Gerente' : 'Operario'}</span></td>
                  <td className={u.estado === 'activo' ? '' : 'tenue'}>{u.estado === 'activo' ? 'Activo' : 'Inactivo'}</td>
                  <td className="tenue">{formatearFecha(u.fecha_creacion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creando && <NuevoUsuarioModal onCerrar={() => setCreando(false)} onCreado={recargar} />}
    </>
  );
}
