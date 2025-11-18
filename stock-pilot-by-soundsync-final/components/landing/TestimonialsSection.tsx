
import React from 'react';
import useScrollAnimation from '../../hooks/useScrollAnimation';

const testimonials = [
    {
        quote: "Stock Pilot's expiry alerts have saved us thousands in potential losses. It's a must-have tool for any grocery seller.",
        name: 'Ravi Kumar',
        role: 'Owner, FreshMart Groceries',
        image: 'https://randomuser.me/api/portraits/men/75.jpg'
    },
    {
        quote: "The automatic matching is genius. We're connecting with new sellers every week without any effort. It has completely streamlined our outreach.",
        name: 'Priya Sharma',
        role: 'Supplier, HealthFirst Medical Supplies',
        image: 'https://randomuser.me/api/portraits/women/75.jpg'
    },
];

const TestimonialsSection: React.FC = () => {
    const sectionRef = useScrollAnimation<HTMLDivElement>();
    return (
        <section id="testimonials" ref={sectionRef} className="py-12 md:py-20 bg-gray-50 dark:bg-gray-800/50">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="max-w-3xl mx-auto text-center pb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Trusted by Businesses Like Yours</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <p className="text-gray-600 dark:text-gray-300 italic mb-4">"{testimonial.quote}"</p>
                            <div className="flex items-center">
                                <img className="w-12 h-12 rounded-full mr-4" src={testimonial.image} alt={testimonial.name} />
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{testimonial.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
