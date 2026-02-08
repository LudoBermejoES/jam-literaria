import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextArea from '../../../src/components/common/TextArea';

describe('TextArea Component', () => {
  it('should render textarea element', () => {
    render(<TextArea id="test-textarea" value="" onChange={vi.fn()} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('should render with correct id', () => {
    render(<TextArea id="my-textarea" value="" onChange={vi.fn()} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('id', 'my-textarea');
  });

  it('should display value prop', () => {
    render(<TextArea id="test" value="Hello World" onChange={vi.fn()} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Hello World');
  });

  it('should display placeholder', () => {
    render(
      <TextArea
        id="test"
        value=""
        onChange={vi.fn()}
        placeholder="Enter text here"
      />
    );
    const textarea = screen.getByPlaceholderText('Enter text here');
    expect(textarea).toBeInTheDocument();
  });

  it('should call onChange when text is entered', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<TextArea id="test" value="" onChange={handleChange} />);
    const textarea = screen.getByRole('textbox');

    await user.type(textarea, 'Hello');
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange).toHaveBeenCalledTimes(5); // Once per character
  });

  it('should be disabled when disabled prop is true', () => {
    render(<TextArea id="test" value="" onChange={vi.fn()} disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('should not be disabled by default', () => {
    render(<TextArea id="test" value="" onChange={vi.fn()} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).not.toBeDisabled();
  });

  it('should apply disabled class when disabled', () => {
    render(<TextArea id="test" value="" onChange={vi.fn()} disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('disabled');
  });

  it('should not apply disabled class when not disabled', () => {
    render(<TextArea id="test" value="" onChange={vi.fn()} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).not.toHaveClass('disabled');
  });

  it('should have auto-resize-textarea class', () => {
    render(<TextArea id="test" value="" onChange={vi.fn()} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('auto-resize-textarea');
  });

  it('should apply default minHeight style', () => {
    render(<TextArea id="test" value="" onChange={vi.fn()} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.style.minHeight).toBe('120px');
  });

  it('should apply custom minHeight style', () => {
    render(<TextArea id="test" value="" onChange={vi.fn()} minHeight="200px" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.style.minHeight).toBe('200px');
  });

  it('should apply default maxHeight style', () => {
    render(<TextArea id="test" value="" onChange={vi.fn()} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.style.maxHeight).toBe('300px');
  });

  it('should apply custom maxHeight style', () => {
    render(<TextArea id="test" value="" onChange={vi.fn()} maxHeight="500px" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.style.maxHeight).toBe('500px');
  });

  it('should be wrapped in textarea-container div', () => {
    const { container } = render(<TextArea id="test" value="" onChange={vi.fn()} />);
    const wrapper = container.querySelector('.textarea-container');
    expect(wrapper).toBeInTheDocument();
  });

  it('should allow typing when not disabled', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<TextArea id="test" value="" onChange={handleChange} />);
    const textarea = screen.getByRole('textbox');

    await user.type(textarea, 'Test text');
    expect(handleChange).toHaveBeenCalled();
  });

  it('should update value when controlled', () => {
    const { rerender } = render(<TextArea id="test" value="Initial" onChange={vi.fn()} />);
    let textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Initial');

    rerender(<TextArea id="test" value="Updated" onChange={vi.fn()} />);
    textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Updated');
  });

  it('should handle multiline text', () => {
    const multilineText = 'Line 1\nLine 2\nLine 3';
    render(<TextArea id="test" value={multilineText} onChange={vi.fn()} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(multilineText);
  });

  it('should handle empty value', () => {
    render(<TextArea id="test" value="" onChange={vi.fn()} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('');
  });
});
