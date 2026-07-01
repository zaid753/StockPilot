
import React, { useState } from 'react';
import { XMarkIcon } from './icons';

interface AddItemModalProps {
    onClose: () => void;
    onAdd: (item: { name: string; quantity: number; price: number; costPrice: number; expiryDate?: string }) => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState<number | ''>('');
    const [price, setPrice] = useState<number | ''>('');
    const [costPrice, setCostPrice] = useState<number | ''>('');
    const [expiryDate, setExpiryDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || quantity === '' || price === '' || costPrice === '') return;

        // Convert YYYY-MM-DD from input to DD-MM-YYYY for consistency with backend
        let formattedExpiry = undefined;
        if (expiryDate) {
            const dateObj = new Date(expiryDate);
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            formattedExpiry = `${day}-${month}-${year}`;
        }

        onAdd({
            name,
            quantity: Number(quantity),
            price: Number(price), // Selling Price
            costPrice: Number(costPrice), // Cost Price
            expiryDate: formattedExpiry
        });
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in-down"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Item</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter product details manually.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="e.g., Tata Salt"
                            className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 outline-none focus:ring-2"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                            <input 
                                type="number" 
                                value={quantity} 
                                onChange={(e) => setQuantity(parseInt(e.target.value) || '')}
                                required
                                min="1"
                                placeholder="0"
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 outline-none focus:ring-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost Price (CP) ₹</label>
                            <input 
                                type="number" 
                                value={costPrice} 
                                onChange={(e) => setCostPrice(parseFloat(e.target.value) || '')}
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 outline-none focus:ring-2"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selling Price (SP) ₹</label>
                            <input 
                                type="number" 
                                value={price} 
                                onChange={(e) => setPrice(parseFloat(e.target.value) || '')}
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 outline-none focus:ring-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                            <input 
                                type="date" 
                                value={expiryDate} 
                                onChange={(e) => setExpiryDate(e.target.value)}
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 outline-none focus:ring-2"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit"
                            disabled={!name || quantity === '' || price === '' || costPrice === ''}
                            className="w-full inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 py-3 px-4 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Add to Inventory
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddItemModal;
