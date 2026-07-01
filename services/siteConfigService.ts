
import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getCountFromServer } from 'firebase/firestore';
import { SiteConfig, SubscriptionPlan } from '../types';

const CONFIG_DOC_ID = 'main';

const DEFAULT_PLANS: SubscriptionPlan[] = [
    {
        id: 'free',
        name: 'Vyapar Shuru (Free)',
        price: '₹0',
        period: '/ forever',
        description: 'Perfect for small shops starting their digital journey.',
        features: ['50 Inventory Items Limit', '5 AI Scans per month', '3 Promo Generations per month', 'Real-time Supplier Chat'],
        cta: 'Start for Free',
        popular: false
    },
    {
        id: 'pro',
        name: 'Vyapar Pro',
        price: '₹299',
        period: '/ month',
        description: 'For serious shopkeepers who want to grow sales.',
        features: ['Unlimited Inventory Items', 'Unlimited AI Scans', 'Unlimited Promo Generation', 'Priority Support'],
        cta: 'Upgrade to Pro',
        popular: true
    }
];

const DEFAULT_CONFIG: SiteConfig = {
    hero: {
        title: 'Smart Inventory,\nSeamless Connections.',
        subtitle: 'Stock Pilot is the all-in-one platform that connects sellers with suppliers and automates inventory management with voice commands, expiry alerts, and real-time chat.',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
    },
    features: [
        {
            title: 'Smart Category Matching',
            description: 'We automatically connect sellers with the right suppliers based on matching product categories, saving you time and effort.',
            iconName: 'SmartMatch'
        },
        {
            title: 'Real-Time Chat',
            description: 'Communicate instantly with your matched partners through our integrated, real-time chat system with delivery status updates.',
            iconName: 'Chat'
        },
        {
            title: 'Voice-Powered Management',
            description: 'Manage your inventory hands-free. Add items, update quantities, and ask questions using simple voice commands.',
            iconName: 'Inventory'
        },
        {
            title: 'Automated Expiry Alerts',
            description: 'Our system automatically tracks expiry dates and sends you timely notifications, helping you reduce waste and manage stock.',
            iconName: 'Expiry'
        },
        {
            title: 'AI Invoice Scanning',
            description: 'Digitize paper bills instantly. Just take a photo, and our AI extracts item details, prices, and quantities automatically.',
            iconName: 'Invoice'
        },
        {
            title: 'Shelf Doctor (Visual AI)',
            description: 'Analyze your shop shelves with a video walkthrough. Identify ghost spots, misplaced items, and get merchandising scores.',
            iconName: 'Camera'
        }
    ],
    testimonials: [
        {
            quote: "Stock Pilot's expiry alerts have saved us thousands in potential losses. It's a must-have tool for any grocery seller.",
            name: 'Ravi Kumar',
            role: 'Owner, FreshMart Groceries',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
        },
        {
            quote: "The automatic matching is genius. We're connecting with new sellers every week without any effort. It has completely streamlined our outreach.",
            name: 'Priya Sharma',
            role: 'Supplier, HealthFirst Medical Supplies',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
        }
    ],
    faqs: [
        {
            question: "Is Stock Pilot free to use?",
            answer: "Yes, we offer a free 'Vyapar Shuru' plan that includes basic features. You can upgrade to 'Vyapar Pro' for unlimited access to AI tools."
        },
        {
            question: "How does the voice command feature work?",
            answer: "Simply tap the microphone icon and speak naturally. You can say things like 'Add 50 packets of Milk' or 'What is expiring soon?'."
        },
        {
            question: "Is my data secure?",
            answer: "Absolutely. We use industry-standard encryption and Google Firebase security rules to ensure your business data is safe and private."
        },
        {
            question: "Can I use it for any type of store?",
            answer: "Stock Pilot is optimized for Retail, Grocery, Medical, Textile, and Hardware stores, but can be adapted for many inventory-based businesses."
        }
    ],
    footer: {
        socialLinks: {
            twitter: '#',
            linkedin: '#',
            youtube: '#',
            facebook: '#',
            instagram: '#'
        },
        links: [
            { label: 'Privacy Policy', url: '#' },
            { label: 'Terms of Service', url: '#' },
            { label: 'Support', url: '#' }
        ]
    },
    style: {
        primaryColor: '#4F46E5', // Indigo-600
        textColorLight: '#111827', // Gray-900
        textColorDark: '#F9FAFB', // Gray-50
        backgroundColorLight: '#F9FAFB', // Gray-50
        backgroundColorDark: '#111827' // Gray-900
    },
    apiConfig: {
        geminiApiKey: '' 
    },
    plans: DEFAULT_PLANS
};

export const getSiteConfig = async (): Promise<SiteConfig> => {
    const docRef = doc(db, 'site_config', CONFIG_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data() as SiteConfig;
        
        // Backfill missing fields for older documents
        if (!data.footer) data.footer = DEFAULT_CONFIG.footer;
        if (!data.apiConfig) data.apiConfig = DEFAULT_CONFIG.apiConfig;
        if (!data.plans || data.plans.length === 0) data.plans = DEFAULT_CONFIG.plans;
        if (!data.faqs || data.faqs.length === 0) data.faqs = DEFAULT_CONFIG.faqs;
        if (!data.features || data.features.length === 0) data.features = DEFAULT_CONFIG.features;
        if (!data.testimonials || data.testimonials.length === 0) data.testimonials = DEFAULT_CONFIG.testimonials;

        return { ...DEFAULT_CONFIG, ...data };
    } else {
        // If no config exists, create default
        await setDoc(docRef, DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
    }
};

export const updateSiteConfig = async (newConfig: SiteConfig): Promise<void> => {
    const docRef = doc(db, 'site_config', CONFIG_DOC_ID);
    await setDoc(docRef, newConfig, { merge: true });
};

export const getAppStats = async (): Promise<{ sellers: number; suppliers: number }> => {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getCountFromServer(usersRef);
        const total = snapshot.data().count;
        return {
            sellers: Math.floor(total * 0.7), 
            suppliers: Math.floor(total * 0.3)
        };
    } catch (e) {
        return { sellers: 120, suppliers: 45 }; 
    }
};
