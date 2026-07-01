
import React, { useState, useEffect } from 'react';
import Header from './Header';
import HeroSection from './HeroSection';
import StatsSection from './StatsSection';
import FeaturesSection from './FeaturesSection';
import BenefitsSection from './BenefitsSection';
import ForSellersSection from './ForSellersSection';
import ForSuppliersSection from './ForSuppliersSection';
import PricingSection from './PricingSection';

import FAQSection from './FAQSection';
import Footer from './Footer';
import LoginComponent from '../Login';
import AOS from 'aos';
import { useSiteContent } from '../../hooks/useSiteContent';
import CustomCursor from '../CustomCursor';

import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
    onAdminClick?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAdminClick }) => {
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);
    const { config } = useSiteContent();
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        AOS.init({
            once: true,
            duration: 1000,
            easing: 'ease-out-cubic',
            offset: 100,
            delay: 50,
        });
    }, []);

    const handleOpenLoginModal = () => setLoginModalOpen(true);
    const handleCloseLoginModal = () => setLoginModalOpen(false);
    
    // Apply dynamic styles if available
    const customStyle = config?.style ? {
        '--primary-color': config.style.primaryColor,
        '--text-light': config.style.textColorLight,
        '--text-dark': config.style.textColorDark,
    } as React.CSSProperties : {};

    return (
        <div 
            className={`bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors duration-300 ${!isLoginModalOpen ? 'cursor-none' : ''}`}
            style={customStyle}
        >
            {/* Inline style to ensure cursor is hidden on all child elements within landing page only when not in modal */}
            <style>{`
                .cursor-none, .cursor-none * {
                    cursor: none !important;
                }
                :root {
                    --text-light-default: #111827;
                    --text-dark-default: #F9FAFB;
                }
                /* Override text colors if variables are set */
                .text-gray-900 { color: var(--text-light, var(--text-light-default)); }
                .dark .text-white { color: var(--text-dark, var(--text-dark-default)); }
            `}</style>
            
            {!isLoginModalOpen && <CustomCursor />}
            
            <Header onLoginClick={handleOpenLoginModal} />
            <main>
                <HeroSection onGetStartedClick={handleOpenLoginModal} config={config?.hero} />
                <StatsSection />
                <FeaturesSection features={config?.features} />
                <BenefitsSection />
                <ForSellersSection />
                <ForSuppliersSection />
                <PricingSection onPlanSelect={(plan) => {
                    localStorage.setItem('preferredPlan', plan);
                    handleOpenLoginModal();
                }} />

                <FAQSection faqs={config?.faqs} />
            </main>
            <Footer onAdminClick={onAdminClick} config={config?.footer} />
            <LoginComponent isOpen={isLoginModalOpen} onClose={handleCloseLoginModal} />
        </div>
    );
};

export default LandingPage;
