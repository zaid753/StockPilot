
import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { ChatIcon, PencilIcon, TrashIcon, SparklesIcon, ArrowDownTrayIcon, PrinterIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, MinusIcon } from './icons';

interface InventoryTableProps {
    items: InventoryItem[];
    loading: boolean;
    totalItems: number;
    totalValue: number;
    onStartChat: () => void;
    onAddItemClick: () => void;
    onEdit: (item: InventoryItem) => void;
    selectedItems: Set<string>;
    onSelectionChange: (selectedIds: Set<string>) => void;
    onBulkDelete: () => void;
    onBulkPromo: () => void;
    onPushUp: (item: InventoryItem) => void;
    onPushDown: (item: InventoryItem) => void;
}

type SortKey = keyof InventoryItem | 'totalValue';

const InventoryTable: React.FC<InventoryTableProps> = ({ 
    items, 
    loading, 
    totalItems, 
    totalValue, 
    onStartChat, 
    onAddItemClick, 
    onEdit,
    selectedItems,
    onSelectionChange,
    onBulkDelete,
    onBulkPromo,
    onPushUp,
    onPushDown
}) => {
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === items.length && items.length > 0) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(items.map(item => item.id)));
        }
    };

    const toggleSelectRow = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        onSelectionChange(newSelected);
    };

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedItems = useMemo(() => {
        const sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (sortConfig.key === 'totalValue') {
                    const valA = a.price * a.quantity;
                    const valB = b.price * b.quantity;
                    return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
                }

                if (sortConfig.key === 'expiryDate') {
                    const timeA = a.expiryTimestamp ? a.expiryTimestamp.toMillis() : Number.MAX_SAFE_INTEGER;
                    const timeB = b.expiryTimestamp ? b.expiryTimestamp.toMillis() : Number.MAX_SAFE_INTEGER;
                    return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
                }

                const aValue = a[sortConfig.key as keyof InventoryItem];
                const bValue = b[sortConfig.key as keyof InventoryItem];

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc' 
                        ? aValue.localeCompare(bValue) 
                        : bValue.localeCompare(aValue);
                }

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
                }

                return 0;
            });
        }
        return sortableItems;
    }, [items, sortConfig]);
    
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

    const isAllSelected = items.length > 0 && selectedItems.size === items.length;

    const handleExportCSV = () => {
        const headers = ['Product Name', 'Quantity', 'Cost Price', 'Selling Price', 'Expiry Date', 'Total Value'];
        const rows = sortedItems.map(item => [
            `"${item.name}"`,
            item.quantity,
            item.costPrice || 0,
            item.price,
            item.expiryDate || 'N/A',
            item.quantity * item.price
        ]);
        
        const csvContent = [
            headers.join(','), 
            ...rows.map(r => r.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `inventory_export_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportMenu(false);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const rowsHtml = sortedItems.map(item => `
            <tr>
                <td>${item.name}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td style="text-align: right;">${formatCurrency(item.costPrice || 0)}</td>
                <td style="text-align: right;">${formatCurrency(item.price)}</td>
                <td>${item.expiryDate || 'N/A'}</td>
                <td style="text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
            </tr>
        `).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Inventory Report</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    h1 { text-align: center; color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .total-row { font-weight: bold; background-color: #f9f9f9; }
                    @media print {
                        @page { margin: 1cm; }
                    }
                </style>
            </head>
            <body>
                <h1>Inventory Report</h1>
                <p>Date: ${new Date().toLocaleDateString()}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th style="text-align: right;">Quantity</th>
                            <th style="text-align: right;">CP</th>
                            <th style="text-align: right;">SP</th>
                            <th>Expiry</th>
                            <th style="text-align: right;">Total Value (SP)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="1">Total Items: ${totalItems}</td>
                            <td colspan="4" style="text-align: right;">Total Inventory Value:</td>
                            <td style="text-align: right;">${formatCurrency(totalValue)}</td>
                        </tr>
                    </tfoot>
                </table>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setShowExportMenu(false);
    };

    const renderSortHeader = (label: string, key: SortKey, align: 'left' | 'right' | 'center' = 'left') => {
        const isActive = sortConfig.key === key;
        return (
            <th 
                scope="col" 
                className={`px-6 py-3 cursor-pointer group select-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                    ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}
                `}
                onClick={() => handleSort(key)}
            >
                <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
                    {label}
                    <span className="flex-shrink-0">
                        {isActive ? (
                            sortConfig.direction === 'asc' ? 
                                <ChevronUpIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : 
                                <ChevronDownIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                            <ChevronDownIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                    </span>
                </div>
            </th>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 dark:bg-opacity-50 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative">
            {/* Header Bar with Export */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/80">
                <h3 className="font-bold text-gray-700 dark:text-gray-200">
                    Inventory List <span className="ml-2 text-xs font-normal text-gray-500">({items.length} items)</span>
                </h3>
                
                <div className="relative">
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Export
                    </button>
                    
                    {showExportMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700 py-1 animate-fade-in-down">
                                <button 
                                    onClick={handleExportCSV}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                    Export as CSV
                                </button>
                                <button 
                                    onClick={handlePrint}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <PrinterIcon className="w-4 h-4" />
                                    Print / Save as PDF
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedItems.size > 0 && (
                <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 flex items-center justify-between border-b border-indigo-200 dark:border-indigo-700 animate-fade-in-down" style={{ height: '61px' }}>
                    <div className="flex items-center gap-3 px-3">
                        <span className="bg-white text-indigo-600 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">{selectedItems.size}</span>
                        <span className="text-sm font-semibold text-white">Items Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={onBulkPromo}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 dark:bg-white/10 text-white text-sm font-medium rounded-md shadow-sm hover:bg-white/30 dark:hover:bg-white/20 border border-white/30 transition-colors"
                        >
                            <SparklesIcon className="w-4 h-4" />
                            Promote
                        </button>
                        <button 
                            onClick={onBulkDelete}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/50 dark:bg-red-500/30 text-white text-sm font-medium rounded-md shadow-sm hover:bg-red-500/70 dark:hover:bg-red-500/50 border border-red-300/50 transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" />
                            Delete
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700 dark:bg-opacity-50">
                        <tr>
                            <th scope="col" className="p-4 w-4">
                                <div className="flex items-center">
                                    <input 
                                        id="checkbox-all" 
                                        type="checkbox" 
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" 
                                    />
                                    <label htmlFor="checkbox-all" className="sr-only">checkbox</label>
                                </div>
                            </th>
                            {renderSortHeader('Product Name', 'name')}
                            <th scope="col" className="px-6 py-3 text-center">Update Qty</th>
                            {renderSortHeader('Quantity', 'quantity', 'right')}
                            {renderSortHeader('CP (Buy)', 'costPrice', 'right')}
                            {renderSortHeader('SP (Sell)', 'price', 'right')}
                            {renderSortHeader('Expiry', 'expiryDate')}
                            {renderSortHeader('Total SP', 'totalValue', 'right')}
                            <th scope="col" className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className={selectedItems.size > 0 ? '' : ''}>
                        {loading ? (
                            <tr><td colSpan={9} className="text-center p-6">Loading inventory...</td></tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="text-center p-10 md:p-16">
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
                            sortedItems.map((item) => {
                                const expiryInfo = getExpiryInfo(item);
                                const isSelected = selectedItems.has(item.id);
                                return (
                                <tr 
                                    key={item.id} 
                                    className={`border-b border-gray-200 dark:border-gray-700 transition-colors 
                                        ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : expiryInfo.rowClassName}
                                    `}
                                >
                                    <td className="w-4 p-4">
                                        <div className="flex items-center">
                                            <input 
                                                id={`checkbox-${item.id}`} 
                                                type="checkbox" 
                                                checked={isSelected}
                                                onChange={() => toggleSelectRow(item.id)}
                                                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" 
                                            />
                                            <label htmlFor={`checkbox-${item.id}`} className="sr-only">checkbox</label>
                                        </div>
                                    </td>
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap capitalize">
                                        {item.name}
                                    </th>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => onPushDown(item)}
                                                className="w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800 dark:text-red-400 flex items-center justify-center transition-colors shadow-sm"
                                                title="Mark as Sold (Decrease Qty)"
                                            >
                                                <MinusIcon className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => onPushUp(item)}
                                                className="w-7 h-7 rounded-full bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800 dark:text-green-400 flex items-center justify-center transition-colors shadow-sm"
                                                title="Add Stock (Increase Qty)"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">{item.quantity}</td>
                                    <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.costPrice || 0)}</td>
                                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.price)}</td>
                                    <td className={`px-6 py-4 ${expiryInfo.className}`}>{expiryInfo.text}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{formatCurrency(item.price * item.quantity)}</td>
                                    <td className="px-6 py-4 text-center flex items-center justify-center gap-3">
                                         <button 
                                            onClick={() => onEdit(item)} 
                                            className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                            title="Edit Item"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
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
                            <td className="p-4"></td>
                            <th scope="row" className="px-6 py-3 text-base">Total</th>
                            <td colSpan={6}></td>
                            <td className="px-6 py-3 text-right">{formatCurrency(totalValue)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default InventoryTable;
