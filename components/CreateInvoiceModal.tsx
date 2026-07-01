
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { InventoryItem, Invoice, InvoiceLineItem } from '../types';
import { createInvoice } from '../services/inventoryService';
import { XMarkIcon, PlusIcon, TrashIcon, PrinterIcon, CheckIcon } from './icons';
import { Timestamp } from 'firebase/firestore';

interface CreateInvoiceModalProps {
    userId: string;
    inventory: InventoryItem[];
    onClose: () => void;
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ userId, inventory, onClose }) => {
    const [step, setStep] = useState<'edit' | 'preview'>('edit');
    const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
    const [customerName, setCustomerName] = useState('Walk-in Customer');
    const [taxRate, setTaxRate] = useState<number>(0);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [isSaving, setIsSaving] = useState(false);
    const [invoiceId, setInvoiceId] = useState<string | null>(null);
    const [error, setError] = useState('');

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter inventory for dropdown
    const filteredInventory = useMemo(() => {
        if (!searchTerm) return [];
        return inventory.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
            item.quantity > 0
        ).slice(0, 10);
    }, [searchTerm, inventory]);

    // Add item to invoice
    const addItem = (item: InventoryItem) => {
        const existingIndex = lineItems.findIndex(l => l.itemId === item.id);
        if (existingIndex >= 0) {
            // Increment qty if already exists
            updateLineItem(existingIndex, 'quantity', lineItems[existingIndex].quantity + 1);
        } else {
            // Add new line
            const newLine: InvoiceLineItem = {
                itemId: item.id,
                itemName: item.name,
                quantity: 1,
                unitSellingPrice: item.price,
                unitCostPrice: item.costPrice || 0,
                lineTotal: item.price
            };
            setLineItems([...lineItems, newLine]);
        }
        setSearchTerm('');
        setShowDropdown(false);
    };

    const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: number) => {
        const newLines = [...lineItems];
        const line = { ...newLines[index] };
        const itemInStock = inventory.find(i => i.id === line.itemId);
        
        if (field === 'quantity') {
            const maxQty = itemInStock?.quantity || 0;
            if (value > maxQty) {
                alert(`Cannot add more than ${maxQty} units.`);
                return;
            }
            if (value < 1) return;
            line.quantity = value;
        } else if (field === 'unitSellingPrice') {
            line.unitSellingPrice = value;
        }

        line.lineTotal = line.quantity * line.unitSellingPrice;
        newLines[index] = line;
        setLineItems(newLines);
    };

    const removeLineItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    // Calculations
    const subTotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxAmount = (subTotal * taxRate) / 100;
    const grandTotal = subTotal + taxAmount - discountAmount;

    const handleGenerate = async () => {
        if (lineItems.length === 0) {
            setError("Add at least one item.");
            return;
        }
        setIsSaving(true);
        setError('');

        const invoiceData: Omit<Invoice, 'id'> = {
            userId,
            customerName,
            issueDate: Timestamp.now(),
            lineItems,
            subTotal,
            taxRate,
            taxAmount,
            discountAmount,
            grandTotal,
            status: 'PAID' // Default to paid for POS style
        };

        try {
            const id = await createInvoice(userId, invoiceData);
            setInvoiceId(id);
            setStep('preview');
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to create invoice.");
        } finally {
            setIsSaving(false);
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {step === 'edit' ? 'Create New Invoice' : 'Invoice Generated'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {step === 'edit' ? (
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        {/* Left: Item Selection & List */}
                        <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700 p-4 overflow-hidden">
                            
                            {/* Search Bar */}
                            <div className="relative mb-4" ref={searchRef}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add Item</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Search inventory..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                                        onFocus={() => setShowDropdown(true)}
                                    />
                                    {showDropdown && searchTerm && (
                                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {inventory.length === 0 ? (
                                                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 italic">
                                                    No items in inventory. Add items in the Inventory tab first.
                                                </div>
                                            ) : filteredInventory.length === 0 ? (
                                                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 italic">
                                                    No matching items in stock.
                                                </div>
                                            ) : (
                                                filteredInventory.map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => addItem(item)}
                                                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex justify-between items-center border-b border-gray-100 dark:border-gray-700 last:border-0"
                                                    >
                                                        <span className="font-medium text-gray-900 dark:text-white capitalize">{item.name}</span>
                                                        <div className="text-right">
                                                            <span className="text-xs text-gray-500 block">Stock: {item.quantity}</span>
                                                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(item.price)}</span>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Item</th>
                                            <th className="px-2 py-2 w-20 text-center">Qty</th>
                                            <th className="px-2 py-2 w-24 text-right">Price</th>
                                            <th className="px-4 py-2 text-right">Total</th>
                                            <th className="px-2 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {lineItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-10 text-gray-500 italic">No items added. Search to begin.</td>
                                            </tr>
                                        ) : (
                                            lineItems.map((line, idx) => (
                                                <tr key={idx} className="bg-white dark:bg-gray-900">
                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white capitalize">{line.itemName}</td>
                                                    <td className="px-2 py-3">
                                                        <input 
                                                            type="number" 
                                                            min="1"
                                                            value={line.quantity}
                                                            onChange={(e) => updateLineItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                                                            className="w-full p-1 border rounded text-center bg-transparent dark:text-white dark:border-gray-600"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-3 text-right">
                                                        <input 
                                                            type="number"
                                                            min="0"
                                                            value={line.unitSellingPrice}
                                                            onChange={(e) => updateLineItem(idx, 'unitSellingPrice', parseFloat(e.target.value) || 0)}
                                                            className="w-full p-1 border rounded text-right bg-transparent dark:text-white dark:border-gray-600"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                                                        {formatCurrency(line.lineTotal)}
                                                    </td>
                                                    <td className="px-2 py-3 text-center">
                                                        <button onClick={() => removeLineItem(idx)} className="text-red-500 hover:text-red-700">
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Right: Summary & Checkout */}
                        <div className="w-full md:w-1/3 bg-gray-50 dark:bg-gray-800 p-6 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Customer Name</label>
                                    <input 
                                        type="text" 
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tax (%)</label>
                                        <input 
                                            type="number" 
                                            value={taxRate}
                                            onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                                            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Discount (₹)</label>
                                        <input 
                                            type="number" 
                                            value={discountAmount}
                                            onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                                            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subTotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>Tax ({taxRate}%)</span>
                                    <span>{formatCurrency(taxAmount)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(discountAmount)}</span>
                                </div>
                                <div className="flex justify-between text-2xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span>Total</span>
                                    <span>{formatCurrency(grandTotal)}</span>
                                </div>

                                {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}

                                <button 
                                    onClick={handleGenerate}
                                    disabled={isSaving || lineItems.length === 0}
                                    className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Processing...' : (
                                        <>
                                            <CheckIcon className="w-5 h-5" /> Confirm & Generate
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // PREVIEW / PRINT MODE
                    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8 overflow-y-auto print:bg-white print:text-black print:p-0">
                        <div className="max-w-2xl mx-auto w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 shadow-sm rounded-xl print:shadow-none print:border-0 print:rounded-none print:p-0">
                            <div className="text-center border-b-2 border-gray-200 dark:border-gray-700 print:border-black pb-6 mb-6">
                                <h1 className="text-4xl font-bold uppercase tracking-wide text-gray-900 dark:text-white print:text-black">INVOICE</h1>
                                <p className="text-gray-500 dark:text-gray-400 print:text-gray-600 mt-1">Order #{invoiceId?.slice(0, 8).toUpperCase()}</p>
                                <p className="text-gray-500 dark:text-gray-400 print:text-gray-600 text-sm">{new Date().toLocaleString()}</p>
                            </div>

                            <div className="mb-8">
                                <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-500 uppercase font-bold">Bill To:</p>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white print:text-black">{customerName}</h3>
                            </div>

                            <table className="w-full text-sm mb-8">
                                <thead>
                                    <tr className="border-b-2 border-gray-200 dark:border-gray-700 print:border-gray-300 text-gray-700 dark:text-gray-300 print:text-black">
                                        <th className="py-3 text-left">Description</th>
                                        <th className="py-3 text-right">Qty</th>
                                        <th className="py-3 text-right">Unit Price</th>
                                        <th className="py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50 print:border-gray-100 text-gray-800 dark:text-gray-200 print:text-black">
                                            <td className="py-3 capitalize">{item.itemName}</td>
                                            <td className="py-3 text-right">{item.quantity}</td>
                                            <td className="py-3 text-right">{formatCurrency(item.unitSellingPrice)}</td>
                                            <td className="py-3 text-right font-medium">{formatCurrency(item.lineTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex justify-end">
                                <div className="w-1/2 space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 print:text-gray-600">
                                        <span>Subtotal:</span>
                                        <span className="text-gray-900 dark:text-gray-200 print:text-black">{formatCurrency(subTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 print:text-gray-600">
                                        <span>Tax ({taxRate}%):</span>
                                        <span className="text-gray-900 dark:text-gray-200 print:text-black">{formatCurrency(taxAmount)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 print:text-gray-600">
                                            <span>Discount:</span>
                                            <span className="text-green-600 dark:text-green-400 print:text-black">-{formatCurrency(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xl font-bold border-t-2 border-gray-200 dark:border-gray-700 print:border-black pt-2 mt-2 text-gray-900 dark:text-white print:text-black">
                                        <span>Total:</span>
                                        <span>{formatCurrency(grandTotal)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 text-center text-sm text-gray-500 print:hidden">
                                <div className="flex justify-center gap-4">
                                    <button 
                                        onClick={handlePrint}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
                                    >
                                        <PrinterIcon className="w-4 h-4" /> Print Invoice
                                    </button>
                                    <button 
                                        onClick={onClose}
                                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateInvoiceModal;
