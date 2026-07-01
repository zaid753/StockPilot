
import React, { useState, useEffect, useMemo } from 'react';
import { SalesLog, InventoryItem } from '../types';
import { getSalesLogs } from '../services/inventoryService';
import { ChartBarIcon, TrendingUpIcon, CurrencyRupeeIcon, XMarkIcon } from './icons';

interface AnalyticsDashboardProps {
    userId: string;
    currentInventory: InventoryItem[];
    onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ userId, currentInventory, onClose }) => {
    const [logs, setLogs] = useState<SalesLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await getSalesLogs(userId);
                setLogs(data);
            } catch (error) {
                console.error("Failed to fetch logs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [userId]);

    const filteredLogs = useMemo(() => {
        const now = new Date();
        const cutoff = new Date();
        
        if (timeRange === 'daily') cutoff.setHours(0, 0, 0, 0);
        else if (timeRange === 'weekly') cutoff.setDate(now.getDate() - 7);
        else if (timeRange === 'monthly') cutoff.setDate(now.getDate() - 30);

        return logs.filter(log => {
            const logDate = log.timestamp.toDate();
            return logDate >= cutoff;
        });
    }, [logs, timeRange]);

    // Calculate Metrics
    const totalItemsSold = filteredLogs.reduce((sum, log) => sum + log.quantity, 0);
    const totalRevenue = filteredLogs.reduce((sum, log) => sum + log.totalRevenue, 0);
    const totalCostOfSold = filteredLogs.reduce((sum, log) => sum + log.totalCost, 0);
    const netProfit = totalRevenue - totalCostOfSold;
    const isLoss = netProfit < 0;

    // Inventory Valuation
    const totalInventoryValue = currentInventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const unsoldStockValue = currentInventory.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0);

    // Top Selling Items
    const itemSales: Record<string, number> = {};
    filteredLogs.forEach(log => {
        itemSales[log.itemName] = (itemSales[log.itemName] || 0) + log.quantity;
    });
    const sortedItems = Object.entries(itemSales).sort((a, b) => b[1] - a[1]);
    const topItems = sortedItems.slice(0, 5);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                        <ChartBarIcon className="w-8 h-8 text-indigo-600" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Insights & Analytics</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900">
                    {/* Filters */}
                    <div className="flex justify-end mb-6 gap-2">
                        {['daily', 'weekly', 'monthly'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeRange(t as any)}
                                className={`px-4 py-2 rounded-lg font-semibold capitalize transition-all ${timeRange === t ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="text-center py-20">Loading data...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* Summary Cards */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Items Sold</p>
                                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{totalItemsSold}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-green-500">
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Total Revenue</p>
                                <p className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-2">{formatCurrency(totalRevenue)}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Cost of Goods Sold</p>
                                <p className="text-3xl font-extrabold text-yellow-600 dark:text-yellow-400 mt-2">{formatCurrency(totalCostOfSold)}</p>
                            </div>
                            <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 ${isLoss ? 'border-red-500' : 'border-indigo-600'}`}>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Net Profit / Loss</p>
                                <p className={`text-3xl font-extrabold mt-2 ${isLoss ? 'text-red-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                    {isLoss ? '-' : '+'}{formatCurrency(Math.abs(netProfit))}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Current Valuation */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <CurrencyRupeeIcon className="w-5 h-5 text-gray-500" /> Current Valuation
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Total Sales Value (SP)</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(totalInventoryValue)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Unsold Stock Cost (CP)</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(unsoldStockValue)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Top Selling Items */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md lg:col-span-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <TrendingUpIcon className="w-5 h-5 text-green-500" /> Top Performing Items
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="px-4 py-2">Item Name</th>
                                            <th className="px-4 py-2 text-right">Qty Sold</th>
                                            <th className="px-4 py-2 text-right">Contribution</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topItems.length > 0 ? topItems.map(([name, qty], idx) => (
                                            <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white capitalize">{name}</td>
                                                <td className="px-4 py-3 text-right">{qty}</td>
                                                <td className="px-4 py-3 text-right text-gray-500">
                                                    {((qty / totalItemsSold) * 100).toFixed(1)}%
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={3} className="text-center py-4 text-gray-500">No sales data yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
