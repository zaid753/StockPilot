import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useInventory } from '../../hooks/useInventory';
import { SalesLog } from '../../types';
import { getSalesLogs } from '../../services/inventoryService';
import { ChartBarIcon, TrendingUpIcon, CurrencyRupeeIcon, ExpiryAlertIcon } from '../icons';

const InventoryDashboard: React.FC = () => {
    const { user } = useAuth();
    const { inventory } = useInventory();
    
    const [logs, setLogs] = useState<SalesLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    useEffect(() => {
        if (!user?.uid) return;
        const fetchLogs = async () => {
            try {
                const data = await getSalesLogs(user.uid);
                setLogs(data);
            } catch (error) {
                console.error("Failed to fetch logs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [user?.uid]);

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
    const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const unsoldStockValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0);

    // Low Stock Alerts
    const lowStockItems = useMemo(() => {
        return inventory.filter(item => item.quantity > 0 && item.quantity <= 5).sort((a, b) => a.quantity - b.quantity);
    }, [inventory]);

    // Top Selling Items
    const itemSales: Record<string, number> = {};
    filteredLogs.forEach(log => {
        itemSales[log.itemName] = (itemSales[log.itemName] || 0) + log.quantity;
    });
    const sortedItems = Object.entries(itemSales).sort((a, b) => b[1] - a[1]);
    const topItems = sortedItems.slice(0, 5);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                        <ChartBarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Business Overview</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Track your sales and inventory valuation</p>
                    </div>
                </div>
                
                {/* Filters */}
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    {['daily', 'weekly', 'monthly'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeRange(t as any)}
                            className={`px-4 py-2 rounded-md font-medium text-sm capitalize transition-all ${timeRange === t ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading insights...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Summary Cards */}
                        <div data-aos="fade-up" data-aos-delay="0" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg hover:-translate-y-1">
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Items Sold</p>
                            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{totalItemsSold}</p>
                        </div>
                        <div data-aos="fade-up" data-aos-delay="100" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg hover:-translate-y-1">
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Revenue</p>
                            <p className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-2">{formatCurrency(totalRevenue)}</p>
                        </div>
                        <div data-aos="fade-up" data-aos-delay="200" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg hover:-translate-y-1">
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Cost of Goods Sold</p>
                            <p className="text-3xl font-extrabold text-yellow-600 dark:text-yellow-400 mt-2">{formatCurrency(totalCostOfSold)}</p>
                        </div>
                        <div data-aos="fade-up" data-aos-delay="300" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                            <div className={`absolute top-0 left-0 w-1 h-full ${isLoss ? 'bg-red-500' : 'bg-indigo-600'}`}></div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Net Profit / Loss</p>
                            <p className={`text-3xl font-extrabold mt-2 ${isLoss ? 'text-red-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                {isLoss ? '-' : '+'}{formatCurrency(Math.abs(netProfit))}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-6">
                            {/* Current Valuation */}
                            <div data-aos="fade-right" data-aos-delay="400" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <CurrencyRupeeIcon className="w-5 h-5 text-gray-400" /> Current Valuation
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Total Sales Value</span>
                                        <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{formatCurrency(totalInventoryValue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Unsold Stock Cost</span>
                                        <span className="font-bold text-lg text-gray-900 dark:text-white">{formatCurrency(unsoldStockValue)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Low Stock Alerts */}
                            <div data-aos="fade-right" data-aos-delay="500" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <ExpiryAlertIcon className="w-5 h-5 text-amber-500" /> Low Stock Alerts
                                </h3>
                                <div className="space-y-3">
                                    {lowStockItems.length > 0 ? lowStockItems.slice(0, 4).map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-3 border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 rounded-xl transition-colors">
                                            <span className="font-medium text-gray-800 dark:text-gray-200 capitalize truncate max-w-[140px]">{item.name}</span>
                                            <span className="text-sm font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1">
                                                {item.quantity} left
                                            </span>
                                        </div>
                                    )) : (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">All items are sufficiently stocked.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Selling Items */}
                        <div data-aos="fade-left" data-aos-delay="600" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2 transition-all hover:shadow-md">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <TrendingUpIcon className="w-5 h-5 text-green-500" /> Top Performing Items
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg rounded-bl-lg">Item Name</th>
                                            <th className="px-4 py-3 text-right">Qty Sold</th>
                                            <th className="px-4 py-3 text-left w-1/2 rounded-tr-lg rounded-br-lg">Contribution</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topItems.length > 0 ? topItems.map(([name, qty], idx) => {
                                            const percentage = ((qty / totalItemsSold) * 100).toFixed(1);
                                            return (
                                            <tr key={idx} className="border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                                                <td className="px-4 py-4 font-medium text-gray-900 dark:text-white capitalize">{name}</td>
                                                <td className="px-4 py-4 text-right font-bold text-gray-700 dark:text-gray-300">{qty}</td>
                                                <td className="px-4 py-4 text-left">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                                            <div className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 min-w-[3rem]">{percentage}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}) : (
                                            <tr><td colSpan={3} className="text-center py-8 text-gray-500 dark:text-gray-400">No sales data found for this period.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default InventoryDashboard;
