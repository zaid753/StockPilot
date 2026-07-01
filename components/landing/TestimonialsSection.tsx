
import React from 'react';
import { Testimonial } from '../../types';

interface TestimonialsSectionProps {
    testimonials?: Testimonial[];
}

const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials }) => {
    const displayTestimonials = testimonials || [];

    return (
        <section id="testimonials" className="py-12 md:py-20 bg-gray-50 dark:bg-gray-800/50">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="max-w-3xl mx-auto text-center pb-12" data-aos="fade-up">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Trusted by Businesses Like Yours</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    {displayTestimonials.map((testimonial, index) => (
                        <div key={index} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col" data-aos="fade-up" data-aos-delay={100 * index}>
                            <p className="text-gray-600 dark:text-gray-300 italic mb-6 flex-grow">"{testimonial.quote}"</p>
                            <div className="flex items-center border-t border-gray-100 dark:border-gray-700 pt-4">
                                <img className="w-12 h-12 rounded-full mr-4 object-cover" src={testimonial.image} alt={testimonial.name} />
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
