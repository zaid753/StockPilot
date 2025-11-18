
import { useEffect } from 'react';
import { checkAllItemsForExpiry } from '../services/expiryService';

const CHECK_INTERVAL = 1000 * 60 * 60; // 1 hour

/**
 * A custom hook that runs a background task on an interval to check for
 * expired inventory items.
 * @param userId The ID of the current user. The scheduler only runs if a user is logged in.
 */
export const useExpiryScheduler = (userId?: string) => {
    useEffect(() => {
        if (!userId) {
            return;
        }

        // Run once immediately on app load
        checkAllItemsForExpiry();

        const intervalId = setInterval(() => {
            checkAllItemsForExpiry();
        }, CHECK_INTERVAL);

        return () => clearInterval(intervalId);
    }, [userId]);
};
