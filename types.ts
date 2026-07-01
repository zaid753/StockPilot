
import { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

export interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    price: number; // This is the Selling Price (SP)
    costPrice?: number; // This is the Base Cost Price (CP)
    supplierId?: string;
    expiryDate?: string; // DD-MM-YYYY format
    // New fields for expiry management
    expiryTimestamp?: Timestamp;
    expiryStatus: 'none' | 'upcoming' | 'expired';
    alertRules: {
        notifyBeforeDays: number;
        notifyWhenExpired: boolean;
    };
    lastAlertedAt?: Timestamp;
}

export interface SalesLog {
    id: string;
    userId: string;
    itemId: string;
    itemName: string;
    quantity: number;
    costPrice: number;
    sellingPrice: number;
    totalRevenue: number; // qty * SP
    totalCost: number;    // qty * CP
    profit: number;       // Revenue - Cost
    timestamp: Timestamp;
    type: 'IN' | 'OUT';   // Movement type
}

export interface InvoiceLineItem {
    itemId: string;
    itemName: string;
    quantity: number;
    unitSellingPrice: number;
    unitCostPrice?: number; // For profit calculation reference
    lineTotal: number;
}

export interface Invoice {
    id: string;
    userId: string;
    customerName: string;
    customerContact?: string;
    issueDate: Timestamp;
    lineItems: InvoiceLineItem[];
    subTotal: number;
    taxRate: number; // Percentage
    taxAmount: number;
    discountAmount: number;
    grandTotal: number;
    status: 'PAID' | 'UNPAID';
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    cta: string;
    popular: boolean;
}

export type User = FirebaseUser;

export interface UserUsage {
    aiScans: number; // Tracks Invoice & Shelf Doctor usage
    promosGenerated: number; // Tracks WhatsApp promo generation
    inventoryCount: number; // Tracks total items (though DB query is better for accurate count)
}

export interface UserProfile {
    uid: string;
    email: string;
    role?: 'seller' | 'supplier'; // Role is optional until onboarding is complete
    name: string; // The user's display name (e.g., "Ravi Traders")
    businessName?: string;
    phone?: string;
    address?: string;
    categories: string[]; // For both sellers (store types) and suppliers (supply types)
    photoURL?: string;
    loginMethod: 'email' | 'google';
    plan: 'free' | 'pro'; // Monetization
    subscriptionExpiry?: Timestamp;
    usage: UserUsage; // New field for tracking limits
}

export interface Transaction {
    id: string;
    userId: string;
    userName: string;
    amount: number;
    plan: 'pro';
    date: Timestamp;
    status: 'success' | 'failed';
    paymentMethod: string; // e.g., 'Credit Card' (simulated)
}

export interface Chat {
    id: string;
    participants: string[]; // [sellerId, supplierId]
    sellerId: string;
    sellerName: string;
    supplierId: string;
    supplierName: string;
    categoriesMatched: string[];
    lastMessageText?: string;
    lastMessageTimestamp?: any; // Firestore Timestamp
    unreadCount: {
        [key: string]: number; // e.g., { "sellerId123": 2, "supplierId456": 0 }
    };
}

export interface Message {
    id: string;
    chatId: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: any; // Firestore Timestamp
    isRead: boolean;
    deliveryStatus: 'sent' | 'delivered' | 'seen';
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    body: string;
    createdAt: Timestamp;
    read: boolean;
    type: 'expiry';
    meta: {
        itemId: string;
        itemName: string;
        expiryTimestamp: Timestamp;
        daysLeft: number;
    };
}

// --- Shelf Doctor Types ---

export interface VisualAnnotation {
    label: string;
    type: 'ghost_spot' | 'misplaced' | 'good';
    frameIndex: number;
    box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 scale
    suggestion: string;
}

export interface ShelfAnalysis {
    id: string;
    userId: string;
    createdAt: Timestamp;
    score: number;
    summary: string;
    powerMove: string;
    visualIssues: VisualAnnotation[];
    capturedFrame: string; // Single representative frame (Base64 or URL)
    capturedFrames?: string[]; // Array of all captured frames (URLs)
    improvedFrame?: string; // AI Hallucinated frame (Base64 or URL)
}

// --- Site Configuration Types for Admin Panel ---

export interface SiteFeature {
    title: string;
    description: string;
    iconName: 'SmartMatch' | 'Chat' | 'Inventory' | 'Expiry' | 'Secure' | 'Cloud' | 'Camera' | 'Invoice' | 'Analytics';
}

export interface Testimonial {
    name: string;
    role: string;
    quote: string;
    image: string;
}

export interface FAQ {
    question: string;
    answer: string;
}

export interface FooterLink {
    label: string;
    url: string;
}

export interface SiteConfig {
    hero: {
        title: string;
        subtitle: string;
        imageUrl: string;
    };
    features: SiteFeature[];
    testimonials: Testimonial[];
    faqs: FAQ[];
    footer: {
        socialLinks: {
            twitter?: string;
            linkedin?: string;
            youtube?: string;
            facebook?: string;
            instagram?: string;
        };
        links: FooterLink[];
    };
    style?: {
        primaryColor: string;
        textColorLight: string;
        textColorDark: string;
        backgroundColorLight: string;
        backgroundColorDark: string;
    };
    apiConfig?: {
        geminiApiKey?: string;
    };
    plans?: SubscriptionPlan[];
}
