
import React from 'react';

const benefits = [
    {
        title: 'Stop Losing Money on Expired Stock',
        description: 'Every year, shopkeepers lose lakhs to expired items. Our smart alert system notifies you weeks in advance, so you can run a sale and recover costs before it is too late.',
        image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=1000',
    },
    {
        title: 'Connect Instantly with Suppliers',
        description: 'Stop calling 10 different people. Our AI matches you with the right suppliers instantly based on your category. Chat, negotiate, and order in real-time within the app.',
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1000',
    },
    {
        title: 'Your Voice is the Controller',
        description: 'Busy hands? Just say "Add 50 packets of Maggi". Our AI understands Hindi, English, and Hinglish accents perfectly, making inventory management hands-free.',
        image: 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&q=80&w=1000',
    },
];

const BenefitsSection: React.FC = () => {
    return (
        <section id="benefits" className="py-24 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="text-center max-w-3xl mx-auto mb-24" data-aos="fade-up">
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
                        Why <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">Stock Pilot?</span>
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mt-6">Real problems, solved by real intelligence.</p>
                </div>

                <div className="space-y-32">
                    {benefits.map((benefit, index) => (
                        <div key={index} className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-24`}>
                            <div className="lg:w-1/2 w-full" data-aos={index % 2 === 1 ? "fade-left" : "fade-right"} data-aos-duration="1000">
                                <div className="relative rounded-3xl overflow-hidden shadow-2xl group aspect-video">
                                    <div className="absolute inset-0 bg-indigo-900/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                                    <img 
                                        src={benefit.image} 
                                        alt={benefit.title} 
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000"
                                    />
                                </div>
                            </div>
                            <div className="lg:w-1/2 w-full" data-aos="fade-up" data-aos-delay="200">
                                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">{benefit.title}</h3>
                                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">{benefit.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BenefitsSection;
