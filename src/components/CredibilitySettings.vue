<template>
  <div class="credibility-settings">
    <h2>Credibility Analyzer Settings</h2>

    <div class="setting-section">
      <h3>Gemini API Key</h3>
      <p class="description">
        Enter your Google Gemini API key to enable intelligent credibility analysis of web pages.
        <a href="https://makersuite.google.com/app/apikey" target="_blank">Get your API key here</a>
      </p>

      <div class="api-key-input-group">
        <div v-if="apiKeySet" class="success-message">
          ✓ API Key is configured
          <button @click="deleteApiKey" class="btn-delete">Remove</button>
        </div>

        <div v-else class="input-group">
          <input
            v-model="apiKey"
            type="password"
            placeholder="Paste your Gemini API key here"
            class="api-key-input"
          />
          <button @click="saveApiKey" :disabled="!apiKey || isSaving" class="btn-save">
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>
        </div>

        <div v-if="saveMessage" :class="['message', saveMessageType]">
          {{ saveMessage }}
        </div>
      </div>
    </div>

    <div class="setting-section info-section">
      <h3>How it Works</h3>
      <ul>
        <li>Click the "Analyze" button in the popup to analyze the current page</li>
        <li>The extension will assess credibility across 8 dimensions</li>
        <li>Results include detailed reasoning and evidence</li>
        <li>Your API key is stored locally in your browser only</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { ApiConfig } from '../utils/apiConfig';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const apiKey = ref<string>('');
const apiKeySet = ref<boolean>(false);
const isSaving = ref<boolean>(false);
const saveMessage = ref<string>('');
const saveMessageType = ref<'success' | 'error'>('success');

onMounted(async () => {
  // Check if API key is already set
  const hasKey = await ApiConfig.hasGeminiApiKey();
  apiKeySet.value = hasKey;
});

async function saveApiKey() {
  if (!apiKey.value) {
    saveMessage.value = 'Please enter an API key';
    saveMessageType.value = 'error';
    return;
  }

  isSaving.value = true;
  saveMessage.value = '';

  try {
    await ApiConfig.setGeminiApiKey(apiKey.value);
    saveMessage.value = '✓ API Key saved successfully!';
    saveMessageType.value = 'success';
    apiKey.value = '';
    apiKeySet.value = true;

    setTimeout(() => {
      saveMessage.value = '';
    }, 3000);
  } catch (error) {
    saveMessage.value = 'Failed to save API key. Please try again.';
    saveMessageType.value = 'error';
  } finally {
    isSaving.value = false;
  }
}

async function deleteApiKey() {
  if (confirm('Are you sure you want to remove the API key?')) {
    try {
      await ApiConfig.deleteGeminiApiKey();
      apiKeySet.value = false;
      saveMessage.value = '✓ API Key removed';
      saveMessageType.value = 'success';

      setTimeout(() => {
        saveMessage.value = '';
      }, 3000);
    } catch (error) {
      saveMessage.value = 'Failed to remove API key';
      saveMessageType.value = 'error';
    }
  }
}
</script>

<style scoped>
.credibility-settings {
  padding: 20px;
  max-width: 600px;
}

h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 24px;
}

h3 {
  color: #34495e;
  font-size: 16px;
  margin-bottom: 10px;
}

.setting-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ecf0f1;
}

.setting-section:last-child {
  border-bottom: none;
}

.description {
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 15px;
  line-height: 1.5;
}

.description a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
}

.description a:hover {
  text-decoration: underline;
}

.api-key-input-group {
  margin-top: 15px;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.api-key-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
}

.api-key-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.btn-save,
.btn-delete {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-save:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-save:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-delete {
  background-color: #e74c3c;
  padding: 5px 10px;
  font-size: 12px;
}

.btn-delete:hover {
  background-color: #c0392b;
}

.success-message {
  padding: 12px 15px;
  background-color: #d5f4e6;
  color: #27ae60;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.message {
  margin-top: 10px;
  padding: 10px 15px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.message.success {
  background-color: #d5f4e6;
  color: #27ae60;
}

.message.error {
  background-color: #fadbd8;
  color: #c0392b;
}

.info-section ul {
  list-style: none;
  padding: 0;
  margin: 10px 0;
}

.info-section li {
  padding: 8px 0;
  padding-left: 25px;
  position: relative;
  color: #555;
  font-size: 14px;
  line-height: 1.6;
}

.info-section li:before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #27ae60;
  font-weight: bold;
}
</style>
