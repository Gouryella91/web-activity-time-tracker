// src/utils/apiConfig.ts

/**
 * Stores and retrieves the Gemini API key from chrome.storage
 */

export const ApiConfig = {
  // Store the API key
  async setGeminiApiKey(apiKey: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
        resolve();
      });
    });
  },

  // Retrieve the API key
  async getGeminiApiKey(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['geminiApiKey'], (result) => {
        resolve(result.geminiApiKey || null);
      });
    });
  },

  // Check if API key exists
  async hasGeminiApiKey(): Promise<boolean> {
    const key = await this.getGeminiApiKey();
    return !!key;
  },

  // Delete the API key (for logout/reset)
  async deleteGeminiApiKey(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['geminiApiKey'], () => {
        resolve();
      });
    });
  }
};
