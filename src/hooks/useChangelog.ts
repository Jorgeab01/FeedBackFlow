import { useState, useEffect, useCallback, useRef } from 'react';
import { changelogData } from '@/data/changelog';
import type { Business } from '@/types';

export function useChangelog(
    business: Business | null,
    updateBusiness: (updates: Partial<Omit<Business, 'id' | 'created_at'>>) => Promise<boolean>
) {
    const [hasUnread, setHasUnread] = useState(false);
    const updateInProgress = useRef(false);

    useEffect(() => {
        if (!business || updateInProgress.current) return;

        const lastSeenId = business.last_seen_changelog;
        const latestItem = changelogData[0]; // Assuming data is ordered newest first

        if (latestItem && lastSeenId !== latestItem.id) {
            setHasUnread(true);
        } else {
            setHasUnread(false);
        }
    }, [business]);

    const markAsRead = useCallback(async () => {
        const latestItem = changelogData[0];
        if (latestItem && business && business.last_seen_changelog !== latestItem.id) {
            setHasUnread(false); // Optimistic UI update
            updateInProgress.current = true;
            await updateBusiness({ last_seen_changelog: latestItem.id });
            updateInProgress.current = false;
        }
    }, [business, updateBusiness]);

    return {
        changelogData,
        hasUnread,
        markAsRead
    };
}
