
import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '../icons';
import { FAQ } from '../../types';

interface FAQSectionProps {
    faqs?: FAQ[];
}

const FAQSection: React.FC<FAQSectionProps> = ({ faqs }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const displayFaqs = faqs || [];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-12 md:py-20 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="max-w-3xl mx-auto text-center pb-12" data-aos="fade-up">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">
                        Got questions? We've got answers.
                    </p>
                </div>
                
                <div className="max-w-3xl mx-auto space-y-4">
                    {displayFaqs.map((faq, index) => (
                        <div 
                            key={index} 
                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                            data-aos="fade-up"
                            data-aos-delay={index * 50}
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full flex justify-between items-center p-4 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <span className="font-semibold text-gray-900 dark:text-white">{faq.question}</span>
                                {openIndex === index ? (
                                    <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                                )}
                            </button>
                            {openIndex === index && (
                                <div className="p-4 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 animate-fade-in-down">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
