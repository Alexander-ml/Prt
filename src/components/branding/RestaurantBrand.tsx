import React from 'react';
import { getRestaurantInitial } from './brandingMeta';

interface RestaurantBrandProps {
  name: string;
  logo?: string;
}

/** Identidad reutilizable del local. Sidebar decide su navegación; este componente solo pinta la marca. */
export const RestaurantBrand: React.FC<RestaurantBrandProps> = ({ name, logo }) => {
  const displayName = name.trim() || 'Restaurante';

  return (
    <div className="restaurant-brand" title={displayName}>
      <div className="restaurant-brand-mark" aria-hidden="true">
        {logo ? (
          <img className="restaurant-brand-logo" src={logo} alt="" />
        ) : (
          <>
            <i className="bi bi-shop-window"></i>
            <span className="restaurant-brand-initial">{getRestaurantInitial(displayName)}</span>
          </>
        )}
      </div>
      <span className="restaurant-brand-name">{displayName}</span>
    </div>
  );
};
