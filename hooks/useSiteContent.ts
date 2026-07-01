
import { useState, useEffect } from 'react';
import { SiteConfig } from '../types';
import { getSiteConfig } from '../services/siteConfigService';

export const useSiteContent = () => {
    const [config, setConfig] = useState<SiteConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await getSiteConfig();
                setConfig(data);
            } catch (error) {
                console.error("Failed to load site config", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    return { config, loading };
};
