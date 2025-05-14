import React from 'react';

interface WelcomeScreenProps {
  userName: string;
  onCreateSession: () => void;
  onJoinSession: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  userName,
  onCreateSession,
  onJoinSession,
}) => {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">
        ¡Hola, {userName}!
      </h2>
      <p className="mb-6 text-gray-600 text-center">
        ¿Qué te gustaría hacer?
      </p>

      <div className="space-y-4">
        <button
          onClick={onCreateSession}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Crear una nueva sesión
        </button>

        <button
          onClick={onJoinSession}
          className="w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-md border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          Unirse a una sesión existente
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen; 