import { useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import usePolling from '../../hooks/usePolling';
import { listarUsuarios, cambiarEstadoUsuario } from '../../api/usuarios.api';
import { mensajeDeError } from '../../api/client';
import Alerta from '../../components/Alerta';
import IndicadorEnVivo from '../../components/IndicadorEnVivo';
import NuevoUsuarioModal from './NuevoUsuarioModal';
import { formatearFecha } from '../../utils/formato';

const ESTADOS = {
  activo: { etiqueta: 'Activo', clase: 'badge--optimo' },
  inactivo: { etiqueta: 'Inactivo', clase: 'badge--agotado' },
  pendiente_aprobacion: { etiqueta: 'Pendiente de aprobación', clase: 'badge--bajo' },
};

export default function UsuariosTab() {
  const { datos: usuarios, error, cargando, ultimaActualizacion, recargar } = usePolling(listarUsuarios);
  const [creando, setCreando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [errorAccion, setErrorAccion] = useState('');

  const alternarEstado = async (usuario) => {
    const nuevoEstado = usuario.estado === 'activo' ? 'inactivo' : 'activo';
    if (!window.confirm(`¿Marcar a ${usuario.nombre} como ${nuevoEstado.toUpperCase()}?`)) return;

    setErrorAccion('');
    try {
      await cambiarEstadoUsuario(usuario.id, nuevoEstado);
      recargar();
    } catch (err) {
      setErrorAccion(mensajeDeError(err));
    }
  };

  const alCrear = (usuario) => {
    recargar();
    setAviso(usuario.credenciales_enviadas
      ? `Cuenta de ${usuario.nombre} creada. Se enviaron las credenciales a ${usuario.email}; queda pendiente de aprobación.`
      : `Cuenta de ${usuario.nombre} creada y pendiente de aprobación, pero NO se pudo enviar el correo con las credenciales (revisa la configuración SMTP). Entrégalas por otro medio.`);
  };

  return (
    <>
      <div className="barra-herramientas">
        <p className="barra-titulo">{usuarios ? `${usuarios.length} usuarios registrados` : 'Usuarios'}</p>
        <IndicadorEnVivo ultimaActualizacion={ultimaActualizacion} error={error} />
        <button type="button" className="btn btn--primario" onClick={() => { setAviso(''); setCreando(true); }}>
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      <Alerta tipo="exito">{aviso}</Alerta>
      <Alerta>{errorAccion}</Alerta>

      {cargando ? <p className="vacio">Cargando usuarios...</p> : (
        <div className="tabla-scroll">
          <table className="tabla tabla--tarjetas">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(usuarios ?? []).map((u) => {
                const estado = ESTADOS[u.estado] ?? ESTADOS.inactivo;
                return (
                  <tr key={u.id}>
                    <td data-label="Nombre" className="fuerte">{u.nombre}</td>
                    <td data-label="Correo">{u.email}</td>
                    <td data-label="Rol"><span className={`badge badge--rol-${u.rol}`}>{u.rol === 'gerencia' ? 'Gerente' : 'Operario'}</span></td>
                    <td data-label="Estado"><span className={`badge ${estado.clase}`}>{estado.etiqueta}</span></td>
                    <td data-label="Creado" className="tenue">{formatearFecha(u.fecha_creacion)}</td>
                    <td data-label="Acciones">
                      {u.protegido ? (
                        <span className="cuenta-protegida" title="Cuenta maestra del sistema: no se puede dar de baja.">
                          <ShieldCheck size={14} /> Cuenta protegida
                        </span>
                      ) : u.estado === 'pendiente_aprobacion' ? (
                        <span className="tenue">Espera al Súper Administrador</span>
                      ) : (
                        <button
                          type="button"
                          className={`btn btn--compacto ${u.estado === 'activo' ? 'btn--secundario' : 'btn--primario'}`}
                          onClick={() => alternarEstado(u)}
                        >
                          {u.estado === 'activo' ? 'Dar de baja' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creando && <NuevoUsuarioModal onCerrar={() => setCreando(false)} onCreado={alCrear} />}
    </>
  );
}
