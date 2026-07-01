import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useInventory } from '../../hooks/useInventory';
import InvoiceModal from '../InvoiceModal';
import CreateInvoiceModal from '../CreateInvoiceModal';
import { ReceiptIcon, DocumentPlusIcon, CurrencyRupeeIcon } from '../icons';

const SalesView: React.FC = () => {
    const { user } = useAuth();
    const { inventory, salesBucket, setSalesBucket } = useInventory();
    
    const [showCreateInvoice, setShowCreateInvoice] = useState(false);
    const [showBucketModal, setShowBucketModal] = useState(false);

    const bucketTotal = salesBucket.reduce((sum, {item, soldQty}) => sum + (item.price * soldQty), 0);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" data-aos="fade-right">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sales & Invoicing</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage your quick sales and generate detailed invoices.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create Invoice Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1" onClick={() => setShowCreateInvoice(true)} data-aos="zoom-in" data-aos-delay="100">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/50 rounded-full mb-4">
                        <DocumentPlusIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Custom Invoice</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                        Generate a detailed invoice with customer name, specific quantities, discounts, and tax rates.
                    </p>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg transition-colors w-full max-w-xs">
                        Start New Invoice
                    </button>
                </div>

                {/* Quick Sales Bucket Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center hover:shadow-xl transition-all cursor-pointer relative transform hover:-translate-y-1" onClick={() => setShowBucketModal(true)} data-aos="zoom-in" data-aos-delay="200">
                    {salesBucket.length > 0 && (
                        <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                            {salesBucket.length} items waiting
                        </div>
                    )}
                    <div className="p-4 bg-green-50 dark:bg-green-900/50 rounded-full mb-4">
                        <ReceiptIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Quick Sales Bucket</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                        Items pushed down from the inventory view gather here. Check out quickly with a single click.
                    </p>
                    {salesBucket.length > 0 ? (
                        <button className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition-colors w-full max-w-xs flex items-center justify-center gap-2">
                            <span>Checkout</span>
                            <span className="bg-green-800 px-2 py-0.5 rounded text-xs">₹{bucketTotal}</span>
                        </button>
                    ) : (
                        <button className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium px-6 py-2 rounded-lg transition-colors w-full max-w-xs" disabled>
                            Bucket is Empty
                        </button>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreateInvoice && user && (
                <CreateInvoiceModal 
                    userId={user.uid} 
                    inventory={inventory} 
                    onClose={() => setShowCreateInvoice(false)} 
                />
            )}

            {showBucketModal && (
                <InvoiceModal 
                    items={salesBucket.map(i => ({...i.item, soldQuantity: i.soldQty}))} 
                    onClose={() => setShowBucketModal(false)} 
                    onClearBucket={() => setSalesBucket([])} 
                />
            )}
        </div>
    );
};

export default SalesView;
