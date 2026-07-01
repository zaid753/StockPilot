import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useInventory } from '../../hooks/useInventory';
import InventoryTable from '../InventoryTable';
import AddItemModal from '../AddItemModal';
import EditItemModal from '../EditItemModal';
import Toast from '../Toast';
import { InventoryItem } from '../../types';
import { deleteItemsBatch, addOrUpdateItem, removeItem, updateInventoryItem } from '../../services/inventoryService';
import { getAi } from '../../services/geminiService';
import { SearchIcon, PlusIcon } from '../icons';

const InventoryView: React.FC = () => {
    const { user } = useAuth();
    const { inventory, loading, setSalesBucket } = useInventory();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    
    const [isGeneratingBulkPromo, setIsGeneratingBulkPromo] = useState(false);
    const [bulkPromoContent, setBulkPromoContent] = useState<string | null>(null);

    const filteredInventory = useMemo(() => {
        return inventory.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [inventory, searchTerm]);

    const totalItems = useMemo(() => inventory.reduce((acc, item) => acc + item.quantity, 0), [inventory]);
    const totalValue = useMemo(() => inventory.reduce((acc, item) => acc + (item.quantity * item.price), 0), [inventory]);

    const handlePushUp = async (item: InventoryItem) => {
        if (!user) return;
        await addOrUpdateItem(user.uid, item.name, 1, item.price, undefined, item.costPrice);
        setToastMessage(`Added 1 unit to ${item.name}`);
    };

    const handlePushDown = async (item: InventoryItem) => {
        if (!user) return;
        const result = await removeItem(user.uid, item.name, 1);
        if (result.success) {
            setSalesBucket(prev => {
                const existing = prev.find(i => i.item.id === item.id);
                if (existing) {
                    return prev.map(i => i.item.id === item.id ? { ...i, soldQty: i.soldQty + 1 } : i);
                }
                return [...prev, { item, soldQty: 1 }];
            });
            setToastMessage(`Sold 1 unit of ${item.name}`);
        } else {
            setToastMessage(result.message);
        }
    };

    const handleBulkDelete = async () => {
        if (!user || selectedItemIds.size === 0) return;
        if (confirm(`Are you sure you want to delete ${selectedItemIds.size} items?`)) {
            await deleteItemsBatch(user.uid, Array.from(selectedItemIds));
            setSelectedItemIds(new Set());
            setToastMessage("Items deleted successfully.");
        }
    };

    const handleBulkPromo = async () => {
        setIsGeneratingBulkPromo(true);
        const selectedItems = inventory.filter(i => selectedItemIds.has(i.id));
        const itemNames = selectedItems.map(i => i.name).join(", ");

        const ai = getAi();
        const prompt = `Create a WhatsApp promo for bundle: ${itemNames}. Discount? Emojis. Short.`;

        try {
            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            setBulkPromoContent(res.text || null);
        } catch (e) {
            console.error(e);
            setToastMessage("Failed to generate promo.");
        } finally {
            setIsGeneratingBulkPromo(false);
        }
    };

    const handleAddItem = async (item: { name: string; quantity: number; price: number; costPrice: number; expiryDate?: string }) => {
        if (!user) return;
        try {
            await addOrUpdateItem(user.uid, item.name, item.quantity, item.price, item.expiryDate, item.costPrice);
            setToastMessage(`Successfully added ${item.name} to inventory.`);
            setShowAddItemModal(false);
        } catch (e: any) {
            console.error("Failed to add item:", e);
            setToastMessage("Failed to add item. Please try again.");
        }
    };

    const handleEditItem = async (updatedItem: InventoryItem) => {
        if (!user) return;
        try {
            const { id, ...updates } = updatedItem;
            await updateInventoryItem(user.uid, id, updates);
            setToastMessage(`Successfully updated ${updatedItem.name}.`);
            setEditingItem(null);
        } catch (e: any) {
            console.error("Failed to update item:", e);
            setToastMessage("Failed to update item. Please try again.");
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col h-full">
            <Toast message={toastMessage} onClose={() => setToastMessage('')} />
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4" data-aos="fade-down">
                <div className="flex items-center bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-full md:max-w-md hover:shadow-md transition-shadow">
                    <SearchIcon className="w-5 h-5 text-gray-400 ml-2" />
                    <input 
                        type="text" 
                        placeholder="Search inventory..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white ml-2 outline-none" 
                    />
                </div>
                <button 
                    onClick={() => setShowAddItemModal(true)} 
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md w-full md:w-auto justify-center"
                >
                    <PlusIcon className="w-5 h-5" /> Add Item
                </button>
            </div>

            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col relative hover:shadow-md transition-shadow" data-aos="fade-up" data-aos-delay="100">
                <div className="flex-1 overflow-auto">
                    <InventoryTable 
                        items={filteredInventory} 
                        loading={loading} 
                        totalItems={totalItems} 
                        totalValue={totalValue} 
                        onStartChat={() => {}} // Removed unused chat modal toggle from table
                        onAddItemClick={() => setShowAddItemModal(true)} 
                        onEdit={setEditingItem} 
                        selectedItems={selectedItemIds} 
                        onSelectionChange={setSelectedItemIds} 
                        onBulkDelete={handleBulkDelete} 
                        onBulkPromo={handleBulkPromo}
                        onPushUp={handlePushUp}
                        onPushDown={handlePushDown}
                    />
                </div>
            </div>

            {/* Promo Modal Overlay */}
            {bulkPromoContent && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-md w-full relative">
                        <button onClick={() => setBulkPromoContent(null)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white">✕</button>
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">WhatsApp Promo Generated</h3>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-4">
                            {bulkPromoContent}
                        </div>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(bulkPromoContent);
                                setToastMessage("Copied to clipboard!");
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                </div>
            )}

            {showAddItemModal && user && (
                <AddItemModal 
                    onAdd={handleAddItem}
                    onClose={() => setShowAddItemModal(false)} 
                />
            )}
            
            {editingItem && user && (
                <EditItemModal 
                    item={editingItem} 
                    onSave={handleEditItem}
                    onClose={() => setEditingItem(null)} 
                />
            )}
        </div>
    );
};

export default InventoryView;
