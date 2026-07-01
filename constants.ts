
import { FunctionDeclaration, Type } from '@google/genai';

export const INITIATE_ADD_ITEM_TOOL: FunctionDeclaration = {
  name: 'initiateAddItem',
  description: 'Initiates the process of adding an item to the inventory. Captures the item name and optionally the quantity. If quantity is not provided, the system will ask for it. NOTE: Item names must be converted to English.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      itemName: { type: Type.STRING, description: 'The name of the item to add (e.g., "apples", "milk"). Translate Hindi names to English (e.g., "Seb" -> "Apple").' },
      quantity: { type: Type.NUMBER, description: 'The number of units of the item to add. This is optional.' },
    },
    required: ['itemName'],
  },
};

export const PROVIDE_ITEM_QUANTITY_TOOL: FunctionDeclaration = {
    name: 'provideItemQuantity',
    description: 'Provides the quantity for an item that is being added to the inventory. The model should use this tool after the user has stated the quantity for an item requested in a previous turn.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            quantity: { type: Type.NUMBER, description: 'The quantity of the item.' },
        },
        required: ['quantity'],
    },
};

export const PROVIDE_ITEM_PRICE_TOOL: FunctionDeclaration = {
  name: 'provideItemPrice',
  description: 'Provides the prices for an item that is being added to the inventory. Can handle Cost Price (CP) and Selling Price (SP).',
  parameters: {
      type: Type.OBJECT,
      properties: {
          price: { type: Type.NUMBER, description: 'The SELLING PRICE (SP) in rupees for a single unit. This is what customers pay.' },
          costPrice: { type: Type.NUMBER, description: 'The COST PRICE (CP) in rupees for a single unit. This is what the shopkeeper paid to buy it.' }
      },
      required: ['price'],
  },
};

export const PROVIDE_ITEM_EXPIRY_DATE_TOOL: FunctionDeclaration = {
    name: 'provideItemExpiryDate',
    description: 'Provides the expiry date for an item being added to the inventory. The model should use this after getting the price.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            expiryDate: { type: Type.STRING, description: 'The expiry date of the item. You must parse any natural language dates (e.g., "in 6 months", "next Tuesday") and convert them to a strict DD-MM-YYYY format.' },
        },
        required: ['expiryDate'],
    },
};

export const UPDATE_ITEM_TOOL: FunctionDeclaration = {
    name: 'updateItem',
    description: 'Updates the price or quantity of an EXISTING item. Use this when the user specifically wants to edit, change, set, or update the price or quantity. e.g., "Change price of milk to 50" or "Set potato quantity to 100".',
    parameters: {
        type: Type.OBJECT,
        properties: {
            itemName: { type: Type.STRING, description: 'The name of the item to update. Translate Hindi names to English.' },
            newPrice: { type: Type.NUMBER, description: 'The new SELLING price to set (optional).' },
            newCostPrice: { type: Type.NUMBER, description: 'The new COST price to set (optional).' },
            newQuantity: { type: Type.NUMBER, description: 'The new absolute quantity to set (optional).' }
        },
        required: ['itemName'],
    },
};


export const REMOVE_ITEM_TOOL: FunctionDeclaration = {
  name: 'removeItem',
  description: 'Removes a specified quantity of an item from the inventory. Use this when the user wants to remove, take out, or sell something.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      itemName: { type: Type.STRING, description: 'The name of the item to remove. Translate Hindi names to English.' },
      quantity: { type: Type.NUMBER, description: 'The number of units of the item to remove.' },
    },
    required: ['itemName', 'quantity'],
  },
};

export const QUERY_INVENTORY_TOOL: FunctionDeclaration = {
    name: 'queryInventory',
    description: 'Answers questions about the current state of the inventory, such as item counts, total value, or item availability.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: { type: Type.STRING, description: 'The user\'s question about the inventory (e.g., "how many apples do I have?", "what is the total value of my stock?").' }
        },
        required: ['query'],
    }
};

export const BULK_ACTION_TOOL: FunctionDeclaration = {
    name: 'performBulkAction',
    description: 'Performs actions on the currently selected items in the inventory table. Use this when the user says "delete selected", "promote selected", "add selected to deal", or "clear selection".',
    parameters: {
        type: Type.OBJECT,
        properties: {
            actionType: { 
                type: Type.STRING, 
                description: 'The action to perform.', 
                enum: ['delete', 'promote', 'deselect'] 
            }
        },
        required: ['actionType'],
    }
};

// Plan Limits Configuration
export const PLAN_LIMITS = {
    free: {
        maxInventoryItems: 50,
        maxAiScans: 5, // Includes Invoice Scan & Shelf Doctor
        maxPromos: 3,  // Includes Business Pilot & Bulk Promo
    },
    pro: {
        maxInventoryItems: 999999,
        maxAiScans: 999999,
        maxPromos: 999999,
    }
};
