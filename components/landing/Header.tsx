
import React, { useState, useEffect } from 'react';

interface HeaderProps {
    onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const handleScroll = () => {
        setIsScrolled(window.scrollY > 10);
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);
    
    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        setIsMenuOpen(false);
    };

    const navLinks = [
        { name: 'Features', id: 'features' },
        { name: 'Benefits', id: 'benefits' },
        { name: 'For Sellers', id: 'for-sellers' },
        { name: 'For Suppliers', id: 'for-suppliers' },
        { name: 'Pricing', id: 'pricing' }, // Added Pricing
        { name: 'FAQ', id: 'faq' }, // Added FAQ
    ];
    
    return (
        <header className={`sticky top-0 z-30 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-md' : 'bg-transparent'}`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Site branding */}
                    <div className="flex-shrink-0 mr-4">
                        <a className="text-2xl font-bold text-gray-900 dark:text-white" href="#hero">
                           Stock Pilot
                        </a>
                    </div>

                    {/* Desktop navigation */}
                    <nav className="hidden md:flex md:grow">
                        <ul className="flex grow justify-center flex-wrap items-center">
                            {navLinks.map(link => (
                                <li key={link.id}>
                                    <button onClick={() => scrollToSection(link.id)} className="font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-5 py-2 flex items-center transition duration-150 ease-in-out">
                                        {link.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Desktop CTA */}
                    <div className="hidden md:block">
                        <button onClick={onLoginClick} className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition duration-150">
                            Login
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map(link => (
                            <button key={link.id} onClick={() => scrollToSection(link.id)} className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left">
                                {link.name}
                            </button>
                        ))}
                        <button onClick={onLoginClick} className="w-full text-left mt-4 px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition duration-150">
                            Login
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
