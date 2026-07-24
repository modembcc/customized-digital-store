import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Contact from './Contact';

describe('Contact', () => {
  it('renders links to each social media platform', () => {
    render(<Contact />);

    expect(screen.getByRole('link', { name: 'Facebook' })).toHaveAttribute(
      'href',
      'https://facebook.com/customizeddigitalstore'
    );
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      'https://instagram.com/customizeddigitalstore'
    );
    expect(screen.getByRole('link', { name: 'X' })).toHaveAttribute(
      'href',
      'https://x.com/customizeddigitalstore'
    );
    expect(screen.getByRole('link', { name: 'YouTube' })).toHaveAttribute(
      'href',
      'https://youtube.com/@customizeddigitalstore'
    );
    expect(screen.getByRole('link', { name: 'Twitch' })).toHaveAttribute(
      'href',
      'https://twitch.tv/customizeddigitalstore'
    );
  });

  it('opens social links in a new tab safely', () => {
    render(<Contact />);

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });
});
