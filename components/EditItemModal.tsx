
import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';

interface EditItemModalProps {
    item: InventoryItem;
    onClose: () => void;
    onSave: (updatedItem: InventoryItem) => void;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ item, onClose, onSave }) => {
    const [name, setName] = useState(item.name);
    const [quantity, setQuantity] = useState(item.quantity);
    const [price, setPrice] = useState(item.price);
    const [costPrice, setCostPrice] = useState(item.costPrice || 0);
    const [expiryDate, setExpiryDate] = useState('');

    useEffect(() => {
        // Convert DD-MM-YYYY to YYYY-MM-DD for input type="date"
        if (item.expiryDate) {
            const parts = item.expiryDate.split('-');
            if (parts.length === 3) {
                setExpiryDate(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
        }
    }, [item.expiryDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Convert YYYY-MM-DD back to DD-MM-YYYY for storage
        let formattedExpiry = '';
        if (expiryDate) {
            const dateObj = new Date(expiryDate);
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            formattedExpiry = `${day}-${month}-${year}`;
        }

        const updatedItem: InventoryItem = {
            ...item,
            name,
            quantity,
            price, // Selling Price
            costPrice, // Cost Price
            expiryDate: formattedExpiry || undefined
        };
        onSave(updatedItem);
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Item</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                        <input 
                            type="number" 
                            value={quantity} 
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                            required
                            min="0"
                            className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost Price (CP) ₹</label>
                            <input 
                                type="number" 
                                value={costPrice} 
                                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                                required
                                min="0"
                                step="0.01"
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selling Price (SP) ₹</label>
                            <input 
                                type="number" 
                                value={price} 
                                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                                required
                                min="0"
                                step="0.01"
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                        <input 
                            type="date" 
                            value={expiryDate} 
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                        />
                    </div>

                    <div className="flex flex-row-reverse gap-2 mt-6">
                        <button 
                            type="submit"
                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Save Changes
                        </button>
                        <button 
                            type="button"
                            onClick={onClose}
                            className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditItemModal;
