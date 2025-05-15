import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NameForm from '../../../components/auth/NameForm';

describe('NameForm', () => {
  it('renders the name input form correctly', () => {
    const mockSubmit = jest.fn();
    render(<NameForm onSubmit={mockSubmit} />);

    expect(screen.getByText('¡Bienvenido a la Jam Literaria!')).toBeInTheDocument();
    expect(screen.getByLabelText('Tu nombre')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Escribe tu nombre aquí')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument();
  });

  it('shows an error when submitting an empty name', () => {
    const mockSubmit = jest.fn();
    render(<NameForm onSubmit={mockSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Por favor, introduce tu nombre')).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with trimmed name when submitting valid name', () => {
    const mockSubmit = jest.fn();
    render(<NameForm onSubmit={mockSubmit} />);

    const nameInput = screen.getByLabelText('Tu nombre');
    fireEvent.change(nameInput, { target: { value: '  John Doe  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(mockSubmit).toHaveBeenCalledWith('John Doe');
  });

  it('displays loading state when isLoading is true', () => {
    const mockSubmit = jest.fn();
    render(<NameForm onSubmit={mockSubmit} isLoading={true} />);

    expect(screen.getByRole('button', { name: 'Cargando...' })).toBeDisabled();
    expect(screen.getByLabelText('Tu nombre')).toBeDisabled();
  });
});
