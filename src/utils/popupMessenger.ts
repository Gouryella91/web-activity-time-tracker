// src/utils/popupMessenger.ts

/**
 * Communicates between popup and content script
 */
export class PopupMessenger {
  /**
   * Gets page content from the active tab
   */
  static async getPageContent(): Promise<any> {
    return new Promise((resolve, reject) => {
      // Get the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) {
          reject(new Error('No active tab found'));
          return;
        }

        // Send message to content script
        chrome.tabs.sendMessage(tabs[0].id!, { action: 'getPageContent' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error('Failed to communicate with page. Refresh and try again.'));
            return;
          }

          if (response?.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || 'Unknown error'));
          }
        });
      });
    });
  }
}
