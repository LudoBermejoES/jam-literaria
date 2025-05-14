import React, { useState } from 'react';

interface JoinSessionFormProps {
  onSubmit: (code: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const JoinSessionForm: React.FC<JoinSessionFormProps> = ({
  onSubmit,
  onBack,
  isLoading = false,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate code
    if (!code || code.trim().length === 0) {
      setError('Por favor, introduce el código de la sesión');
      return;
    }

    // Clear any previous error
    setError(null);
    
    // Call the onSubmit handler with the code
    onSubmit(code.trim());
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Unirse a una sesión
      </h2>
      <p className="mb-6 text-gray-600 text-center">
        Introduce el código para unirte a una sesión existente
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="code" className="block text-gray-700 text-sm font-medium mb-1">
            Código de sesión
          </label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Introduce el código de la sesión"
            disabled={isLoading}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Volver
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Uniendo...' : 'Unirse'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinSessionForm; 