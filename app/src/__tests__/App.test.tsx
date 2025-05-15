import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

jest.mock('../hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({
    user: null,
    session: null,
    isLoading: false,
    error: null,
    registerUser: jest.fn(),
    createSession: jest.fn(),
    joinSession: jest.fn(),
    logout: jest.fn()
  })
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/bienvenido a la jam literaria/i)).toBeInTheDocument();
  });
}); 