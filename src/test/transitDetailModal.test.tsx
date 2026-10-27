import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransitDetailModal } from '../components/TransitDetailModal';
import { ZodiacSignTransit } from '../types';
import type { SocialStatus } from '../../supabase/functions/_shared/socialDue';

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

const status = (state: SocialStatus['state']): SocialStatus => ({ state, window: null, postAt: null, due: false });

const renderModal = (state: SocialStatus['state'], extra: Partial<React.ComponentProps<typeof TransitDetailModal>> = {}) =>
  render(
    <TransitDetailModal
      transit={mockTransit}
      isOpen={true}
      onClose={vi.fn()}
      onSaveContent={vi.fn()}
      onApprove={vi.fn()}
      onUndo={vi.fn()}
      socialStatus={status(state)}
      {...extra}
    />
  );

describe('TransitDetailModal - one action button per state', () => {
  it('Pending shows "Approve" (and no undo)', () => {
    const onApprove = vi.fn();
    renderModal('pending', { onApprove });
    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }));
    expect(onApprove).toHaveBeenCalledWith('gemini');
    expect(screen.queryByRole('button', { name: /undo approval/i })).toBeNull();
    expect(screen.queryByText(/approve for syndication/i)).toBeNull();
  });

  it('Approved shows "Undo approval" (and no approve)', () => {
    const onUndo = vi.fn();
    renderModal('approved', { onUndo });
    fireEvent.click(screen.getByRole('button', { name: /undo approval/i }));
    expect(onUndo).toHaveBeenCalledWith('gemini');
    expect(screen.queryByRole('button', { name: /^approve$/i })).toBeNull();
  });

  it.each(['posted', 'missed'] as const)('%s shows no approve or undo button', (state) => {
    renderModal(state);
    expect(screen.queryByRole('button', { name: /^approve$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /undo approval/i })).toBeNull();
  });

  it('shows the state as a badge', () => {
    renderModal('missed');
    expect(screen.getByText('Missed')).toBeDefined();
  });

  it('renders the confirmation inside the modal without closing', () => {
    renderModal('approved', { feedback: { type: 'success', message: 'Approved. Posts Tue 2:00 PM ET.' }, onDismissFeedback: vi.fn() });
    expect(screen.getByText('Approved. Posts Tue 2:00 PM ET.')).toBeDefined();
    expect(screen.getByText('Status: Approved')).toBeDefined();
  });

  it('has no webhook notice', () => {
    renderModal('pending', { feedback: { type: 'warning', message: 'Journal article not queued.' } });
    expect(screen.queryByText(/webhook/i)).toBeNull();
  });
});
