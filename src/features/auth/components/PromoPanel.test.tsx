import { render, screen } from '@/test/utils';
import { describe, it, expect, vi } from 'vitest';
import PromoPanel from './PromoPanel';

// Mock dependencies if any (PromoPanel is mostly presentation)

describe('PromoPanel', () => {
    it('renders the video background', () => {
        render(<PromoPanel />);
        // The video might be hidden on small screens, but JSDOM doesn't handle CSS display:none unless computed styles are involved.
        // We can check if the video element is in the document.
        // Using querySelector since we don't have a role for video usually without aria-label
        const video = document.querySelector('video');
        expect(video).toBeInTheDocument();
    });

    it('renders the sliding headlines', () => {
        render(<PromoPanel />);
        expect(screen.getByText(/Experience world-class events/i)).toBeInTheDocument();
        expect(screen.getByText(/Seamless ticketing, instant access/i)).toBeInTheDocument();
    });

    it('plays the video on mount', () => {
        const playMock = vi.spyOn(global.window.HTMLMediaElement.prototype, 'play');
        render(<PromoPanel />);
        expect(playMock).toHaveBeenCalled();
    });
});
