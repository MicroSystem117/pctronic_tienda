import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { resolveMediaUrl, useCategories } from '../../shared/api/client';
import { CategoryCircleSkeleton } from '../../shared/ui/molecules/CategoryCircle';

export function CategoriesPage() {
  const { data: categories, loading } = useCategories();

  return (
    <section className="section section--page">
      <div className="container">
        <p className="eyebrow">Explora por departamento</p>
        <h1 className="page-title">Categorías PC TRONIC</h1>

        <div className="grid-prods">
          {loading
            ? Array.from({ length: 8 }, (_, i) => <CategoryCircleSkeleton key={i} />)
            : categories.map((cat) => (
                <Link
                  key={cat.category_id}
                  to={`/catalogo?categoria=${encodeURIComponent(cat.slug)}`}
                  className="prod-card"
                >
                  <div className="prod-card__media">
                    <img src={resolveMediaUrl(cat.image_url, cat.name)} alt={cat.name} loading="lazy" />
                  </div>
                  <div className="prod-card__body">
                    <h3 className="prod-card__title">{cat.name}</h3>
                    {cat.description && <span className="prod-card__sub">{cat.description}</span>}
                  </div>
                  <div className="prod-card__foot">
                    <span className="link-arrow">
                      {cat.active_products_count} productos <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
