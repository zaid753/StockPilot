
import React from 'react';
import { InventoryItem } from '../types';
import { ChatIcon } from './icons';

interface InventoryTableProps {
    items: InventoryItem[];
    loading: boolean;
    totalItems: number;
    totalValue: number;
    onStartChat: () => void;
    onAddItemClick: () => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ items, loading, totalItems, totalValue, onStartChat, onAddItemClick }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };
    
    const getExpiryInfo = (item: InventoryItem): { text: string; className: string; rowClassName: string } => {
        if (!item.expiryTimestamp) {
            return { text: 'N/A', className: '', rowClassName: 'hover:bg-gray-50 dark:hover:bg-gray-700/50' };
        }
        const now = new Date();
        const expiryDate = item.expiryTimestamp.toDate();
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) {
            return {
                text: 'Expired',
                className: 'font-bold text-red-600 dark:text-red-400',
                rowClassName: 'bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30'
            };
        }
        if (daysLeft <= (item.alertRules?.notifyBeforeDays || 7)) {
            return {
                text: `in ${daysLeft} days`,
                className: 'font-bold text-yellow-600 dark:text-yellow-400',
                rowClassName: 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-500/20 dark:hover:bg-yellow-500/30'
            };
        }
        return { text: item.expiryDate || 'N/A', className: '', rowClassName: 'hover:bg-gray-50 dark:hover:bg-gray-700/50' };
    };

    return (
        <div className="bg-white dark:bg-gray-800 dark:bg-opacity-50 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700 dark:bg-opacity-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Product Name</th>
                            <th scope="col" className="px-6 py-3 text-right">Quantity</th>
                            <th scope="col" className="px-6 py-3 text-right">Price/Item</th>
                            <th scope="col" className="px-6 py-3">Expiry</th>
                            <th scope="col" className="px-6 py-3 text-right">Total Value</th>
                            <th scope="col" className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center p-6">Loading inventory...</td></tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center p-10 md:p-16">
                                    <div className="max-w-md mx-auto">
                                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Your Inventory is Empty</h2>
                                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                                            Ready to take control of your stock? Add your first item using our smart voice assistant.
                                        </p>
                                        <button
                                            onClick={onAddItemClick}
                                            className="px-6 py-3 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 shadow-lg transition duration-150 ease-in-out font-semibold"
                                        >
                                            Add First Item
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            items.sort((a, b) => a.name.localeCompare(b.name)).map((item) => {
                                const expiryInfo = getExpiryInfo(item);
                                return (
                                <tr 
                                    key={item.id} 
                                    className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${expiryInfo.rowClassName}`}
                                >
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap capitalize">
                                        {item.name}
                                    </th>
                                    <td className="px-6 py-4 text-right">{item.quantity}</td>
                                    <td className="px-6 py-4 text-right">{formatCurrency(item.price)}</td>
                                    <td className={`px-6 py-4 ${expiryInfo.className}`}>{expiryInfo.text}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{formatCurrency(item.price * item.quantity)}</td>
                                    <td className="px-6 py-4 text-center">
                                         {/* The chat button now opens the modal which lists all suppliers */}
                                        <button 
                                            onClick={onStartChat} 
                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                                            title={`Find suppliers for ${item.name}`}
                                        >
                                            <ChatIcon className="w-6 h-6" />
                                        </button>
                                    </td>
                                </tr>
                                )
                            })
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 dark:bg-opacity-50">
                            <th scope="row" className="px-6 py-3 text-base">Total</th>
                            <td className="px-6 py-3 text-right">{totalItems}</td>
                            <td colSpan={3}></td>
                            <td className="px-6 py-3 text-right">{formatCurrency(totalValue)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default InventoryTable;
