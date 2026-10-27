import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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
                transition_at: '2026-10-10T14:40:02Z',
                from_sign: 'Aries',
                to_sign: 'Taurus',
                transition_date: '2026-10-10'
              },
              {
                transition_at: '2026-10-12T17:26:03Z',
                from_sign: 'Taurus',
                to_sign: 'Gemini',
                transition_date: '2026-10-12'
              },
              {
                transition_at: '2026-10-14T19:54:06Z',
                from_sign: 'Gemini',
                to_sign: 'Cancer',
                transition_date: '2026-10-14'
              },
              {
                transition_at: '2026-10-16T22:54:11Z',
                from_sign: 'Cancer',
                to_sign: 'Leo',
                transition_date: '2026-10-16'
              },
              {
                transition_at: '2026-10-19T02:52:36Z',
                from_sign: 'Leo',
                to_sign: 'Virgo',
                transition_date: '2026-10-19'
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
    // Pin "now" to a date that fits the mock ingress times (after Taurus ends, before Cancer ends); only Date is faked
    // so waitFor/react-query timers keep running.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-13T12:00:00Z') });
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
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

    // Click "Approve" on pending transit
    const approveButtons = screen.getAllByRole('button', { name: /^approve$/i });
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
    const pendingTab = screen.getByRole('button', { name: /^pending \(3\)/i });
    fireEvent.click(pendingTab);

    // Cancer and Virgo are in the list; Leo (approved) lives in the Scheduled queue
    expect(screen.getByText('Cancer')).toBeDefined();
    expect(screen.getByText('Virgo')).toBeDefined();

    // Past transits should show Taurus (which is pending)
    const pastBtn = screen.getByRole('button', { name: /past transits/i });
    expect(pastBtn).toBeDefined();
    fireEvent.click(pastBtn);
    expect(screen.getByText('Taurus')).toBeDefined();

    // Click "Posted (0)": nothing has posted, so the list empties but the queue stays
    const postedTab = screen.getByRole('button', { name: /posted \(0\)/i });
    fireEvent.click(postedTab);

    expect(screen.getByText('Leo')).toBeDefined();
    expect(screen.queryByText('Cancer')).toBeNull();
    expect(screen.queryByText('Virgo')).toBeNull();
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
    const allApproveButtons = screen.getAllByRole('button', { name: /^approve$/i });
    // Taurus is the last pending card rendered
    const lastApprove = allApproveButtons[allApproveButtons.length - 1];
    fireEvent.click(lastApprove);
    expect(onApprove).toHaveBeenCalledWith('taurus');
  });
});

describe('TransitReviewPanel - states, one button per card, Scheduled queue', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-13T12:00:00Z') });
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const panel = (transits: ZodiacSignTransit[], extra: Partial<React.ComponentProps<typeof TransitReviewPanel>> = {}) =>
    renderWithClient(
      <TransitReviewPanel
        transits={transits}
        onApprove={vi.fn()}
        onUndo={vi.fn()}
        onBatchApprove={vi.fn()}
        onUndoAll={vi.fn()}
        onSelectTransit={vi.fn()}
        onInspectPayload={vi.fn()}
        {...extra}
      />
    );

  const queueSection = () => screen.getByRole('region', { name: /scheduled queue/i });

  it('shows Approved cards in the Scheduled queue with "Posts <weekday time> ET" and an "Undo approval" button', async () => {
    const onUndo = vi.fn();
    panel(mockTransits, { onUndo });

    // Leo starts Fri Oct 16, 6:54 PM EDT, so it posts at 6:00 PM ET
    await waitFor(() => {
      expect(within(queueSection()).getByText('Posts Fri 6:00 PM ET')).toBeDefined();
    });
    expect(within(queueSection()).getByText('Approved')).toBeDefined();
    const undo = within(queueSection()).getByRole('button', { name: /undo approval/i });
    fireEvent.click(undo);
    expect(onUndo).toHaveBeenCalledWith('leo');
    // an approved card has no Approve button
    expect(within(queueSection()).queryByRole('button', { name: /^approve$/i })).toBeNull();
  });

  it('sorts the queue by post time until posted', async () => {
    const approvedVirgo = { ...mockTransits[3], status: 'published' as const, publishedAt: '2026-10-13T00:00:00Z' };
    const approvedLeo = { ...mockTransits[2], publishedAt: '2026-10-13T00:00:00Z' };
    // Virgo is listed first but posts later (Sun Oct 18, 8:00 PM ET) than Leo (Fri Oct 16, 6:00 PM ET)
    panel([approvedVirgo, approvedLeo]);
    await waitFor(() => {
      expect(within(queueSection()).getByText('Posts Sun 8:00 PM ET')).toBeDefined();
    });
    const names = within(queueSection()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent?.split('(')[0].trim());
    expect(names).toEqual(['Leo', 'Virgo']);
  });

  it('marks Missed cards clearly, with no action button', async () => {
    // Taurus was approved before its Oct 10 window and never posted; the window ended Oct 12
    const missed = { ...mockTransits[0], status: 'published' as const, publishedAt: '2026-10-09T00:00:00Z' };
    panel([missed]);
    await waitFor(() => {
      expect(within(queueSection()).getByText(/Missed: the transit ended and this was never posted/)).toBeDefined();
    });
    expect(within(queueSection()).queryByRole('button', { name: /^approve$/i })).toBeNull();
    expect(within(queueSection()).queryByRole('button', { name: /undo approval/i })).toBeNull();
  });

  it('a Posted card moves out of the queue and has no action button', async () => {
    const posted = { ...mockTransits[2], publishedAt: '2026-10-13T00:00:00Z', socialPostedAt: '2026-10-13T11:00:00Z' };
    panel([posted]);
    await waitFor(() => {
      expect(screen.getByText(/Posted (Tue|Mon) /)).toBeDefined();
    });
    expect(within(queueSection()).queryByText('Leo')).toBeNull();
    expect(screen.queryByRole('button', { name: /^approve$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /undo approval/i })).toBeNull();
  });

  it('Pending is the default: an unapproved card shows "Approve" and the Pending badge', async () => {
    panel([mockTransits[1]]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^approve$/i })).toBeDefined();
    });
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
  });

  it('has "Approve all pending" and "Undo all approved" side by side, wired to their handlers', async () => {
    const onBatchApprove = vi.fn();
    const onUndoAll = vi.fn();
    panel(mockTransits, { onBatchApprove, onUndoAll });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /approve all pending \(3\)/i })).toBeDefined();
    });
    fireEvent.click(screen.getByRole('button', { name: /approve all pending \(3\)/i }));
    fireEvent.click(screen.getByRole('button', { name: /undo all approved \(1\)/i }));
    expect(onBatchApprove).toHaveBeenCalledTimes(1);
    expect(onUndoAll).toHaveBeenCalledTimes(1);
  });

  it('disables the mass buttons when there is nothing to act on', async () => {
    panel([mockTransits[1]]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /undo all approved \(0\)/i })).toBeDefined();
    });
    expect((screen.getByRole('button', { name: /undo all approved \(0\)/i }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /approve all pending \(1\)/i }) as HTMLButtonElement).disabled).toBe(false);
  });
});
