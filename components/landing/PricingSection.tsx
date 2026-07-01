
import React from 'react';
import { CheckIcon } from '../icons';
import { useSiteContent } from '../../hooks/useSiteContent';

interface PricingSectionProps {
    onPlanSelect?: (planType: 'free' | 'pro') => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ onPlanSelect }) => {
    const { config } = useSiteContent();
    // Use dynamic plans if available, otherwise array will be empty and nothing renders or it will use defaults from service
    const plans = config?.plans || [];

    if (plans.length === 0) return null;

    return (
        <section id="pricing" className="py-24 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="text-center max-w-3xl mx-auto mb-20" data-aos="fade-up">
                    <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">
                        Simple Pricing. <span className="text-indigo-600">Maximum Profit.</span>
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mt-6">
                        Try all features for free with usage limits. Upgrade to unleash full power.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan, index) => (
                        <div 
                            key={index} 
                            className={`relative p-10 rounded-3xl border flex flex-col transition-all duration-500 transform
                                ${plan.popular 
                                    ? 'bg-white dark:bg-gray-800 border-indigo-600 shadow-2xl ring-4 ring-indigo-600/20 scale-105 z-10 hover:-translate-y-3 hover:scale-110 hover:shadow-[0_15px_40px_rgba(79,70,229,0.4)]' 
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl hover:-translate-y-2'}
                            `}
                            data-aos="flip-left"
                            data-aos-delay={index * 200}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 -mt-5 mr-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wide shadow-lg">
                                    Best Value
                                </div>
                            )}
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">{plan.description}</p>
                            </div>
                            <div className="mb-8">
                                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                                <span className="text-gray-500 dark:text-gray-400 font-medium text-lg">{plan.period}</span>
                            </div>
                            <ul className="mb-10 space-y-5 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start">
                                        <div className="flex-shrink-0 p-1 bg-green-100 dark:bg-green-900 rounded-full mr-4">
                                            <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <span className="text-gray-700 dark:text-gray-300 text-base">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <button 
                                onClick={() => onPlanSelect?.(plan.popular ? 'pro' : 'free')}
                                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform active:scale-95 ${plan.popular 
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/50' 
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'}`}>
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
                
                <div className="mt-16 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        Prices inclusive of GST. Cancel anytime. 
                        <span className="block mt-2 text-indigo-600 dark:text-indigo-400 font-medium">Made with ❤️ for India 🇮🇳</span>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
