import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransitReviewPanel } from '../components/TransitReviewPanel';
import { ZodiacSignTransit } from '../types';

// Mock supabase client to return controlled transitions
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() =>
          Promise.resolve({
            data: [
              {
                transition_at: '2026-09-28T14:40:02Z',
                from_sign: 'Aries',
                to_sign: 'Taurus',
                transition_date: '2026-09-28'
              },
              {
                transition_at: '2026-09-30T17:26:03Z',
                from_sign: 'Taurus',
                to_sign: 'Gemini',
                transition_date: '2026-09-30'
              },
              {
                transition_at: '2026-10-02T19:54:06Z',
                from_sign: 'Gemini',
                to_sign: 'Cancer',
                transition_date: '2026-10-02'
              },
              {
                transition_at: '2026-10-04T22:54:11Z',
                from_sign: 'Cancer',
                to_sign: 'Leo',
                transition_date: '2026-10-04'
              },
              {
                transition_at: '2026-10-07T02:52:36Z',
                from_sign: 'Leo',
                to_sign: 'Virgo',
                transition_date: '2026-10-07'
              }
            ],
            error: null
          })
        )
      }))
    }))
  }
}));

const mockTransits: ZodiacSignTransit[] = [
  {
    id: 'taurus',
    sign: 'Taurus',
    symbol: '♉',
    element: 'Earth',
    ruler: 'Venus',
    dates: 'Apr 20 – May 20',
    transitTitle: 'Moon in Taurus',
    transitAspect: 'Sensory Resonance',
    transit_period: 'Sep 28 – Sep 30',
    copy: 'Earth medicine grounds.',
    powerHour: '11:30 AM EST',
    ritualTip: 'Drink matcha.',
    hashtags: ['#TaurusEnergy'],
    status: 'pending',
  },
  {
    id: 'cancer',
    sign: 'Cancer',
    symbol: '♋',
    element: 'Water',
    ruler: 'Moon',
    dates: 'Jun 21 – Jul 22',
    transitTitle: 'Moon in Cancer',
    transitAspect: 'Oceanic Intuition',
    transit_period: 'Oct 2 – Oct 4',
    copy: 'Intuition flows.',
    powerHour: '07:20 PM EST',
    ritualTip: 'Saltwater bath.',
    hashtags: ['#CancerEnergy'],
    status: 'pending',
  },
  {
    id: 'leo',
    sign: 'Leo',
    symbol: '♌',
    element: 'Fire',
    ruler: 'Sun',
    dates: 'Jul 23 – Aug 22',
    transitTitle: 'Moon in Leo',
    transitAspect: 'Solar Radiance',
    transit_period: 'Oct 4 – Oct 7',
    copy: 'Creative spark.',
    powerHour: '12:00 PM EST',
    ritualTip: 'Sun meditation.',
    hashtags: ['#LeoEnergy'],
    status: 'published',
  },
  {
    id: 'virgo',
    sign: 'Virgo',
    symbol: '♍',
    element: 'Earth',
    ruler: 'Mercury',
    dates: 'Aug 23 – Sep 22',
    transitTitle: 'Moon in Virgo',
    transitAspect: 'Sacred Architecture',
    transit_period: 'Oct 7 – Oct 9',
    copy: 'Order and focus.',
    powerHour: '09:40 AM EST',
    ritualTip: 'Cleanse altar.',
    hashtags: ['#VirgoEnergy'],
    status: 'pending',
  }
];

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      }
    }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('TransitReviewPanel - Sorting & Filtering Controls', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('renders sort control with "Current → Future" active by default and visual indication', async () => {
    renderWithClient(
      <TransitReviewPanel
        transits={mockTransits}
        onApprove={vi.fn()}
        onBatchApprove={vi.fn()}
        onSelectTransit={vi.fn()}
        onInspectPayload={vi.fn()}
      />
    );

    const currentToFutureBtn = screen.getByRole('button', { name: /current → future/i });
    const futureToCurrentBtn = screen.getByRole('button', { name: /future → current/i });

    expect(currentToFutureBtn).toBeDefined();
    expect(futureToCurrentBtn).toBeDefined();
    expect(currentToFutureBtn.getAttribute('aria-pressed')).toBe('true');
    expect(futureToCurrentBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('toggles sort selection to "Future → Current", updates active state, and persists to sessionStorage', async () => {
    renderWithClient(
      <TransitReviewPanel
        transits={mockTransits}
        onApprove={vi.fn()}
        onBatchApprove={vi.fn()}
        onSelectTransit={vi.fn()}
        onInspectPayload={vi.fn()}
      />
    );

    const futureToCurrentBtn = screen.getByRole('button', { name: /future → current/i });
    fireEvent.click(futureToCurrentBtn);

    expect(futureToCurrentBtn.getAttribute('aria-pressed')).toBe('true');
    expect(sessionStorage.getItem('moonday_mission_control_transit_sort')).toBe('future-to-current');
  });

  it('restores persisted sort order from sessionStorage on mount', async () => {
    sessionStorage.setItem('moonday_mission_control_transit_sort', 'future-to-current');

    renderWithClient(
      <TransitReviewPanel
        transits={mockTransits}
        onApprove={vi.fn()}
        onBatchApprove={vi.fn()}
        onSelectTransit={vi.fn()}
        onInspectPayload={vi.fn()}
      />
    );

    const futureToCurrentBtn = screen.getByRole('button', { name: /future → current/i });
    expect(futureToCurrentBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('filters default view to current and upcoming transits, grouping past transits into collapsible section', async () => {
    renderWithClient(
      <TransitReviewPanel
        transits={mockTransits}
        onApprove={vi.fn()}
        onBatchApprove={vi.fn()}
        onSelectTransit={vi.fn()}
        onInspectPayload={vi.fn()}
      />
    );

    // Cancer, Leo, and Virgo are current/upcoming on Oct 2, 2026.
    // Taurus (Sep 28 – Sep 30 in mockTransitions) is a past transit.
    // Wait for useQuery to resolve transitions and populate the past transits section
    const pastSectionBtn = await waitFor(() => {
      const btn = screen.getByRole('button', { name: /past transits/i });
      expect(btn).toBeDefined();
      return btn;
    });

    expect(screen.getByText('Cancer')).toBeDefined();
    expect(screen.getByText('Leo')).toBeDefined();
    expect(screen.getByText('Virgo')).toBeDefined();

    expect(pastSectionBtn.getAttribute('aria-expanded')).toBe('false');

    // Click to expand past transits
    fireEvent.click(pastSectionBtn);
    expect(pastSectionBtn.getAttribute('aria-expanded')).toBe('true');

    // Taurus is now visible inside past transits
    expect(screen.getByText('Taurus')).toBeDefined();
  });

  it('re-orders the cards when toggling between "Current → Future" and "Future → Current"', async () => {
    renderWithClient(
      <TransitReviewPanel
        transits={mockTransits}
        onApprove={vi.fn()}
        onBatchApprove={vi.fn()}
        onSelectTransit={vi.fn()}
        onInspectPayload={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Cancer')).toBeDefined();
    });

    // In "Current → Future", Cancer (current) appears before Virgo (furthest future)
    const headings = screen.getAllByRole('heading', { level: 3 });
    const signNames = headings.map(h => h.textContent?.split('(')[0].trim());
    expect(signNames.indexOf('Cancer')).toBeLessThan(signNames.indexOf('Virgo'));

    // Switch to "Future → Current"
    const futureToCurrentBtn = screen.getByRole('button', { name: /future → current/i });
    fireEvent.click(futureToCurrentBtn);

    const reversedHeadings = screen.getAllByRole('heading', { level: 3 });
    const reversedNames = reversedHeadings.map(h => h.textContent?.split('(')[0].trim());
    expect(reversedNames.indexOf('Virgo')).toBeLessThan(reversedNames.indexOf('Cancer'));
  });

  it('triggers onApprove, onSelectTransit, and onInspectPayload callbacks correctly', async () => {
    const onApprove = vi.fn();
    const onSelect = vi.fn();
    const onInspect = vi.fn();

    renderWithClient(
      <TransitReviewPanel
        transits={mockTransits}
        onApprove={onApprove}
        onBatchApprove={vi.fn()}
        onSelectTransit={onSelect}
        onInspectPayload={onInspect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Cancer')).toBeDefined();
    });

    // Click "Approve Sign" on pending transit
    const approveButtons = screen.getAllByRole('button', { name: /approve sign/i });
    fireEvent.click(approveButtons[0]);
    expect(onApprove).toHaveBeenCalled();

    // Click Payload button
    const payloadButtons = screen.getAllByRole('button', { name: /payload/i });
    fireEvent.click(payloadButtons[0]);
    expect(onInspect).toHaveBeenCalled();
  });

  it('filters by status tabs ("Pending" and "Published") in harmony with sorting and past transits', async () => {
    renderWithClient(
      <TransitReviewPanel
        transits={mockTransits}
        onApprove={vi.fn()}
        onBatchApprove={vi.fn()}
        onSelectTransit={vi.fn()}
        onInspectPayload={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /past transits/i })).toBeDefined();
    });

    // Click "Pending (3)"
    const pendingTab = screen.getByRole('button', { name: /pending \(3\)/i });
    fireEvent.click(pendingTab);

    // Cancer and Virgo should be in active list, Leo (published) should not be visible
    expect(screen.getByText('Cancer')).toBeDefined();
    expect(screen.getByText('Virgo')).toBeDefined();
    expect(screen.queryByText('Leo')).toBeNull();

    // Past transits should show Taurus (which is pending)
    const pastBtn = screen.getByRole('button', { name: /past transits/i });
    expect(pastBtn).toBeDefined();
    fireEvent.click(pastBtn);
    expect(screen.getByText('Taurus')).toBeDefined();

    // Click "Published (1)"
    const publishedTab = screen.getByRole('button', { name: /published \(1\)/i });
    fireEvent.click(publishedTab);

    // Leo is published and upcoming, so visible in active
    expect(screen.getByText('Leo')).toBeDefined();
    expect(screen.queryByText('Cancer')).toBeNull();
    expect(screen.queryByText('Virgo')).toBeNull();
    // Taurus is pending, so not in past published
    expect(screen.queryByRole('button', { name: /past transits/i })).toBeNull();
  });

  it('allows approving and inspecting payload on cards inside the past transits section', async () => {
    const onApprove = vi.fn();
    const onInspect = vi.fn();

    renderWithClient(
      <TransitReviewPanel
        transits={mockTransits}
        onApprove={onApprove}
        onBatchApprove={vi.fn()}
        onSelectTransit={vi.fn()}
        onInspectPayload={onInspect}
      />
    );

    const pastBtn = await waitFor(() => {
      const btn = screen.getByRole('button', { name: /past transits/i });
      expect(btn).toBeDefined();
      return btn;
    });

    // Expand past section
    fireEvent.click(pastBtn);

    // Taurus is the past transit card
    expect(screen.getByText('Taurus')).toBeDefined();

    // Click Approve on the past card
    const allApproveButtons = screen.getAllByRole('button', { name: /approve sign/i });
    // Taurus is the last pending card rendered
    const lastApprove = allApproveButtons[allApproveButtons.length - 1];
    fireEvent.click(lastApprove);
    expect(onApprove).toHaveBeenCalledWith('taurus');
  });
});
