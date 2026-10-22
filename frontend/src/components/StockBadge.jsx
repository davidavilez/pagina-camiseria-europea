import { ESTADOS_STOCK } from '../utils/stock';

export default function StockBadge({ estado }) {
  const { etiqueta, clase } = ESTADOS_STOCK[estado] ?? ESTADOS_STOCK.agotado;
  return <span className={`badge ${clase}`}>{etiqueta}</span>;
}
