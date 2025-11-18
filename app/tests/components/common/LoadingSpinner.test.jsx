import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import LoadingSpinner from '../../../src/components/common/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('should render without crashing', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('should render spinner circle', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.spinner-circle')).toBeInTheDocument();
  });

  it('should apply medium size class by default', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('medium');
  });

  it('should apply large size class when specified', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('large');
  });

  it('should apply small size class when specified', () => {
    const { container } = render(<LoadingSpinner size="small" />);
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('small');
  });

  it('should apply primary color class by default', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('primary');
  });

  it('should apply secondary color class when specified', () => {
    const { container } = render(<LoadingSpinner color="secondary" />);
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('secondary');
  });

  it('should apply white color class when specified', () => {
    const { container } = render(<LoadingSpinner color="white" />);
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('white');
  });

  it('should combine size and color classes', () => {
    const { container } = render(<LoadingSpinner size="large" color="secondary" />);
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('loading-spinner');
    expect(spinner).toHaveClass('large');
    expect(spinner).toHaveClass('secondary');
  });

  it('should always have base loading-spinner class', () => {
    const { container } = render(<LoadingSpinner size="small" color="white" />);
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('loading-spinner');
  });
});
