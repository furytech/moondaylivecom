import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransitDetailModal } from '../components/TransitDetailModal';
import { ZodiacSignTransit } from '../types';

const mockTransit: ZodiacSignTransit = {
  id: 'gemini',
  sign: 'Gemini',
  symbol: '♊',
  element: 'Air',
  ruler: 'Mercury',
  dates: 'May 21 – Jun 20',
  transitTitle: 'Moon in Gemini',
  transitAspect: 'Mental Velocity',
  transit_period: 'Sep 30 – Oct 2',
  copy: 'Ideas spark across the network.',
  powerHour: '02:15 PM EST',
  ritualTip: 'Write three morning pages.',
  hashtags: ['#GeminiMoon'],
  status: 'pending',
  imageUrl: 'https://example.com/gemini.png',
};

describe('TransitDetailModal - Label Consistency & Feedback', () => {
  it('renders button label as "Approve Sign" instead of "Approve for Syndication"', () => {
    render(
      <TransitDetailModal
        transit={mockTransit}
        isOpen={true}
        onClose={vi.fn()}
        onSaveContent={vi.fn()}
        onApprove={vi.fn()}
      />
    );

    // Verify "Approve Sign" exists
    expect(screen.getByRole('button', { name: /approve sign/i })).toBeDefined();

    // Verify "Approve for Syndication" is gone
    expect(screen.queryByText(/approve for syndication/i)).toBeNull();
  });

  it('renders confirmation feedback inside modal without closing', () => {
    const onDismiss = vi.fn();
    render(
      <TransitDetailModal
        transit={mockTransit}
        isOpen={true}
        onClose={vi.fn()}
        onSaveContent={vi.fn()}
        onApprove={vi.fn()}
        feedback={{
          type: 'success',
          message: 'Approved. Sent to Make.com for syndication.',
        }}
        onDismissFeedback={onDismiss}
      />
    );

    expect(screen.getByText('Approved. Sent to Make.com for syndication.')).toBeDefined();
    expect(screen.getByText('Status: Approved')).toBeDefined();
  });

  it('renders webhook failure feedback inside modal', () => {
    render(
      <TransitDetailModal
        transit={mockTransit}
        isOpen={true}
        onClose={vi.fn()}
        onSaveContent={vi.fn()}
        onApprove={vi.fn()}
        feedback={{
          type: 'warning',
          message: 'Approval saved but Make.com webhook did not respond. Check your automation.',
        }}
      />
    );

    expect(
      screen.getByText('Approval saved but Make.com webhook did not respond. Check your automation.')
    ).toBeDefined();
    expect(screen.getByText('Warning: Webhook Delivery')).toBeDefined();
  });
});
