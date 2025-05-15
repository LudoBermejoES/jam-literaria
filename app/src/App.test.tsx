import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders welcome title', () => {
  render(<App />);
  const titleElement = screen.getByText(/bienvenido a la jam literaria/i);
  expect(titleElement).toBeInTheDocument();
});
