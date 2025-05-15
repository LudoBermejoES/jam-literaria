import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import JoinSessionForm from '../../../components/auth/JoinSessionForm';

describe('JoinSessionForm', () => {
  it('renders the join session form correctly', () => {
    const mockSubmit = jest.fn();
    const mockBack = jest.fn();
    render(<JoinSessionForm onSubmit={mockSubmit} onBack={mockBack} />);

    expect(screen.getByText('Unirse a una sesión')).toBeInTheDocument();
    expect(screen.getByLabelText('Código de sesión')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Introduce el código de la sesión')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unirse' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', () => {
    const mockSubmit = jest.fn();
    const mockBack = jest.fn();
    render(<JoinSessionForm onSubmit={mockSubmit} onBack={mockBack} />);

    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('shows an error when submitting an empty code', () => {
    const mockSubmit = jest.fn();
    const mockBack = jest.fn();
    render(<JoinSessionForm onSubmit={mockSubmit} onBack={mockBack} />);

    fireEvent.click(screen.getByRole('button', { name: 'Unirse' }));
    expect(screen.getByText('Por favor, introduce el código de la sesión')).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with trimmed code when submitting a valid code', () => {
    const mockSubmit = jest.fn();
    const mockBack = jest.fn();
    render(<JoinSessionForm onSubmit={mockSubmit} onBack={mockBack} />);

    const codeInput = screen.getByLabelText('Código de sesión');
    fireEvent.change(codeInput, { target: { value: '  ABC123  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unirse' }));

    expect(mockSubmit).toHaveBeenCalledWith('ABC123');
  });

  it('displays loading state when isLoading is true', () => {
    const mockSubmit = jest.fn();
    const mockBack = jest.fn();
    render(<JoinSessionForm onSubmit={mockSubmit} onBack={mockBack} isLoading={true} />);

    expect(screen.getByRole('button', { name: 'Uniendo...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Volver' })).toBeDisabled();
    expect(screen.getByLabelText('Código de sesión')).toBeDisabled();
  });
});
