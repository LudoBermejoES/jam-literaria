import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NameForm } from '../../../../../app/src/components/auth';

describe('NameForm component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<NameForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText('¡Bienvenido a la Jam Literaria!')).toBeInTheDocument();
    expect(screen.getByLabelText('Tu nombre')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Escribe tu nombre aquí')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<NameForm onSubmit={mockOnSubmit} isLoading={true} />);
    
    expect(screen.getByRole('button', { name: 'Cargando...' })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByLabelText('Tu nombre')).toBeDisabled();
  });

  it('validates empty name', () => {
    render(<NameForm onSubmit={mockOnSubmit} />);
    
    // Submit without entering a name
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    
    expect(screen.getByText('Por favor, introduce tu nombre')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with trimmed name when form is submitted with valid name', () => {
    render(<NameForm onSubmit={mockOnSubmit} />);
    
    // Enter a name with spaces at beginning and end
    fireEvent.change(screen.getByLabelText('Tu nombre'), { target: { value: '  John Doe  ' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    
    // Check that onSubmit was called with trimmed name
    expect(mockOnSubmit).toHaveBeenCalledWith('John Doe');
  });
}); 