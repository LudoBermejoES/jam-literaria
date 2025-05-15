import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WelcomeScreen from '../../../components/auth/WelcomeScreen';

describe('WelcomeScreen', () => {
  const mockCreateSession = jest.fn();
  const mockJoinSession = jest.fn();
  const testUserName = 'John Doe';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders welcome screen with user name correctly', () => {
    render(
      <WelcomeScreen
        userName={testUserName}
        onCreateSession={mockCreateSession}
        onJoinSession={mockJoinSession}
      />
    );
    
    expect(screen.getByText(`¡Hola, ${testUserName}!`)).toBeInTheDocument();
    expect(screen.getByText('¿Qué te gustaría hacer?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear una nueva sesión/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unirse a una sesión existente/i })).toBeInTheDocument();
  });

  it('calls onCreateSession when create session button is clicked', () => {
    render(
      <WelcomeScreen
        userName={testUserName}
        onCreateSession={mockCreateSession}
        onJoinSession={mockJoinSession}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /crear una nueva sesión/i }));
    expect(mockCreateSession).toHaveBeenCalledTimes(1);
    expect(mockJoinSession).not.toHaveBeenCalled();
  });

  it('calls onJoinSession when join session button is clicked', () => {
    render(
      <WelcomeScreen
        userName={testUserName}
        onCreateSession={mockCreateSession}
        onJoinSession={mockJoinSession}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /unirse a una sesión existente/i }));
    expect(mockJoinSession).toHaveBeenCalledTimes(1);
    expect(mockCreateSession).not.toHaveBeenCalled();
  });
}); 