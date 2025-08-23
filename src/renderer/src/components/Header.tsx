/**
 * Componente para el encabezado de la aplicación
 */
import React from 'react';
import YtLogo from './ytLogo';

/**
 * Muestra el logo y el título de la aplicación
 */
const Header: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="mb-8">
        <YtLogo height="150" width="500" />
      </div>
      <h1 className="text-4xl font-bold mb-12">Desktop Downloader</h1>
    </div>
  );
};

export default Header;
