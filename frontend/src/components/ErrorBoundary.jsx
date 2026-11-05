import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

// Vite/navegador cuando un chunk lazy ya no existe (p. ej. tras reinstalar dependencias).
const esErrorDeCarga = (error) => /dynamically imported module|Importing a module script failed|Outdated Optimize Dep|ChunkLoadError/i
  .test(String(error?.message ?? error));

/**
 * Sin esto, cualquier error de render (o un chunk que no carga) desmonta toda
 * la app y deja la pantalla en blanco. Aquí se muestra un aviso con salida.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error de interfaz:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="pagina pagina--estrecha">
        <section className="tarjeta tarjeta--aviso">
          <AlertTriangle size={40} />
          <h2>{esErrorDeCarga(error) ? 'La aplicación se actualizó' : 'Algo salió mal'}</h2>
          <p className="tenue">
            {esErrorDeCarga(error)
              ? 'Hay una versión nueva de la página. Recárgala para continuar.'
              : 'Ocurrió un error inesperado al mostrar esta pantalla.'}
          </p>
          <button type="button" className="btn btn--primario btn--bloque" onClick={() => window.location.reload()}>
            Recargar página
          </button>
          {this.props.onCerrarSesion && (
            <button type="button" className="btn btn--secundario btn--bloque" onClick={() => { this.props.onCerrarSesion(); this.setState({ error: null }); }}>
              Cerrar sesión
            </button>
          )}
        </section>
      </main>
    );
  }
}
