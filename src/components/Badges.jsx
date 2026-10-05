import { formatRoute, productType } from '../lib/format';

export default function Badges({ medicine }) {
  const { productTypes, routes } = medicine;
  if (!productTypes.length && !routes.length) return null;

  return (
    <ul className="badges" aria-label="Product type and route">
      {productTypes.map((t) => {
        const type = productType(t);
        return (
          <li key={t} className={`badge badge--${type.kind}`} title={type.long}>
            {type.short}
          </li>
        );
      })}
      {routes.map((r) => (
        <li key={r} className="badge">
          {formatRoute(r)}
        </li>
      ))}
    </ul>
  );
}
