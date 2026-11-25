import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../../api/client';
import type { StoreCategory } from '../../api/contracts';

export function CategoryCircle({ category }: { category: StoreCategory }) {
  const imgUrl = resolveMediaUrl(category.image_url, category.name);
  return (
    <Link to={`/catalogo?categoria=${encodeURIComponent(category.slug)}`} className="cat-circle">
      <span className="cat-circle__orb">
        <img src={imgUrl} alt={category.name} loading="lazy" decoding="async" />
      </span>
      <span className="cat-circle__name">{category.name}</span>
    </Link>
  );
}

export function CategoryCircleSkeleton() {
  return (
    <div className="cat-circle" aria-hidden="true">
      <div className="skeleton skeleton--circle" />
      <div className="skeleton" style={{ width: '70%', height: 12, marginTop: 4 }} />
    </div>
  );
}
