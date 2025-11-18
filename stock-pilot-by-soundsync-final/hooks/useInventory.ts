import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getInventoryStream } from '../services/inventoryService';
import { InventoryItem } from '../types';

interface InventoryContextType {
    inventory: InventoryItem[];
    loading: boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode; userId: string }> = ({ children, userId }) => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        setLoading(true);
        const unsubscribe = getInventoryStream(userId, (items) => {
            setInventory(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const value = { inventory, loading };

    // FIX: Replaced JSX with React.createElement to resolve TypeScript error in a .ts file.
    return React.createElement(InventoryContext.Provider, { value }, children);
};

export const useInventory = (): InventoryContextType => {
    const context = useContext(InventoryContext);
    if (context === undefined) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
};