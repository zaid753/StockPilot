
import React, { useRef } from 'react';
import { InventoryItem } from '../types';
import { XMarkIcon, PrinterIcon, TrashIcon } from './icons';

interface InvoiceItem extends InventoryItem {
    soldQuantity: number;
}

interface InvoiceModalProps {
    items: InvoiceItem[];
    onClose: () => void;
    onClearBucket: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ items, onClose, onClearBucket }) => {
    const printRef = useRef<HTMLDivElement>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.soldQuantity * item.price), 0);
    const totalProfit = items.reduce((sum, item) => sum + ((item.price - (item.costPrice || 0)) * item.soldQuantity), 0);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow && printRef.current) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Invoice - ${new Date().toLocaleDateString()}</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; color: black; background: white; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; }
                        th { background-color: #f9f9f9; }
                        .totals { margin-top: 20px; text-align: right; }
                        .totals p { font-size: 1.2em; font-weight: bold; }
                        .text-indigo-600 { color: #4f46e5; }
                        .text-gray-600 { color: #4b5563; }
                    </style>
                </head>
                <body>
                    ${printRef.current.innerHTML}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
            // Optional: Clear bucket after printing
            // onClearBucket(); 
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generate Invoice</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Printable Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" ref={printRef}>
                    <div className="text-center border-b-2 border-gray-200 dark:border-gray-700 pb-4 mb-6">
                        <h1 className="text-3xl font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">INVOICE</h1>
                        <p className="text-gray-500 dark:text-gray-400">Date: {new Date().toLocaleString()}</p>
                    </div>

                    {items.length === 0 ? (
                        <p className="text-center text-gray-500 italic py-10">No items in the sales bucket.</p>
                    ) : (
                        <>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                                        <th className="py-3 text-left bg-gray-50 dark:bg-gray-800/50">Item</th>
                                        <th className="py-3 text-right bg-gray-50 dark:bg-gray-800/50">Qty</th>
                                        <th className="py-3 text-right bg-gray-50 dark:bg-gray-800/50">Price (SP)</th>
                                        <th className="py-3 text-right bg-gray-50 dark:bg-gray-800/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                                            <td className="py-3 capitalize font-medium">{item.name}</td>
                                            <td className="py-3 text-right">{item.soldQuantity}</td>
                                            <td className="py-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(item.price)}</td>
                                            <td className="py-3 text-right font-medium">{formatCurrency(item.price * item.soldQuantity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-8 flex justify-end">
                                <div className="text-right w-full md:w-1/2 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">Grand Total:</span>
                                        <span className="font-bold text-xl text-indigo-600 dark:text-indigo-400">{formatCurrency(totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 text-xs text-green-600 dark:text-green-400 font-medium">
                                        <span>(Internal Profit on Sale):</span>
                                        <span>{formatCurrency(totalProfit)}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between gap-4">
                    <button 
                        onClick={onClearBucket}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg font-semibold transition-colors"
                        title="Clear all items from bucket"
                    >
                        <TrashIcon className="w-5 h-5" /> Clear Bucket
                    </button>
                    <button 
                        onClick={handlePrint}
                        disabled={items.length === 0}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PrinterIcon className="w-5 h-5" /> Print Invoice
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
