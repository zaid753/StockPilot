
import { FunctionDeclaration, Type } from '@google/genai';

export const INITIATE_ADD_ITEM_TOOL: FunctionDeclaration = {
  name: 'initiateAddItem',
  description: 'Initiates the process of adding an item to the inventory. Captures the item name and optionally the quantity. If quantity is not provided, the system will ask for it.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      itemName: { type: Type.STRING, description: 'The name of the item to add (e.g., "apples", "milk"). Must be plural if quantity > 1.' },
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
  description: 'Provides the price for an item that is being added to the inventory. The model should use this tool after the user has stated the price for the item requested in the previous turn.',
  parameters: {
      type: Type.OBJECT,
      properties: {
          price: { type: Type.NUMBER, description: 'The price in rupees for a single unit of the item.' },
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


export const REMOVE_ITEM_TOOL: FunctionDeclaration = {
  name: 'removeItem',
  description: 'Removes a specified quantity of an item from the inventory. Use this when the user wants to remove, take out, or sell something.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      itemName: { type: Type.STRING, description: 'The name of the item to remove (e.g., "apples", "milk"). Must be plural if quantity > 1.' },
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