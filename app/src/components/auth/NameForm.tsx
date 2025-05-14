import React, { useState } from 'react';

interface NameFormProps {
  onSubmit: (name: string) => void;
  isLoading?: boolean;
}

const NameForm: React.FC<NameFormProps> = ({ onSubmit, isLoading = false }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name
    if (!name || name.trim().length === 0) {
      setError('Por favor, introduce tu nombre');
      return;
    }

    // Clear any previous error
    setError(null);
    
    // Call the onSubmit handler with the name
    onSubmit(name.trim());
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">¡Bienvenido a la Jam Literaria!</h2>
      <p className="mb-6 text-gray-600 text-center">
        Introduce tu nombre para comenzar
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-1">
            Tu nombre
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Escribe tu nombre aquí"
            disabled={isLoading}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Cargando...' : 'Continuar'}
        </button>
      </form>
    </div>
  );
};

export default NameForm; 