<template>
  <div class="headerBlock">
    <div class="d-inline-block">
      <img class="logo" height="30" src="../assets/icons/48x48.png" />
      <p class="header">Web Activity Time Tracker</p>
    </div>
    <div class="icons-block">
      <div>
        <img
          class="dark-mode-icon"
          height="25"
          src="../assets/icons/light-mode.svg"
          title="Disable Dark Mode"
          v-if="darkMode == true"
          @click="changeDarkMode(false)"
        />
        <img
          class="dark-mode-icon"
          title="Enable Dark Mode"
          height="25"
          src="../assets/icons/dark-mode.svg"
          v-if="darkMode == false"
          @click="changeDarkMode(true)"
        />

        <!-- NEW: Credibility Analyzer Button -->
        <a @click="analyzePageCredibility" :class="{ 'analyzing': isAnalyzing }">
          {{ isAnalyzing ? t('analyzing.message') : 'Analyze' }}
          <img src="../assets/icons/settings.svg" height="22" />
        </a>

        <a @click="openPage(SettingsTab.Pomodoro)"
          >{{ t('pomodoroMode.message') }}<img src="../assets/icons/pomodoro.svg" height="22"
        /></a>
        <a class="filter" @click="openPage(SettingsTab.Dashboard)"
          >{{ t('dashboard.message') }}<img height="22" src="../assets/icons/dashboard.svg"
        /></a>
        <a class="filter" @click="openPage(SettingsTab.GeneralSettings)"
          >{{ t('settings.message') }}<img height="22" src="../assets/icons/settings.svg"
        /></a>
      </div>
    </div>
  </div>

  <!-- NEW: Credibility Analysis Modal -->
  <div v-if="showAnalysisResult" class="analysis-modal">
    <div class="modal-content">
      <button class="close-btn" @click="showAnalysisResult = false">×</button>

      <div v-if="analysisError" class="error-message">
        <p>{{ analysisError }}</p>
      </div>

      <div v-else-if="credibilityAnalysis" class="analysis-container">
        <h2>Credibility Analysis</h2>

        <!-- Overall Score -->
        <div class="score-container" :style="{ borderColor: getRatingColor(credibilityAnalysis.rating) }">
          <div class="overall-score">
            <span class="score-number">{{ credibilityAnalysis.overallScore.toFixed(1) }}</span>
            <span class="score-max">/10</span>
          </div>
          <div class="rating" :style="{ color: getRatingColor(credibilityAnalysis.rating) }">
            {{ credibilityAnalysis.rating }}
          </div>
          <p class="summary">{{ credibilityAnalysis.summary }}</p>
        </div>

        <!-- Dimensions Breakdown -->
        <div class="dimensions">
          <h3>Dimension Breakdown</h3>
          <div v-for="dimension in credibilityAnalysis.dimensions" :key="dimension.name" class="dimension-item">
            <div class="dimension-header">
              <span class="dimension-name">{{ dimension.name }}</span>
              <span class="dimension-score">{{ dimension.score }}/10</span>
            </div>
            <p class="dimension-reasoning">{{ dimension.reasoning }}</p>
            <div v-if="dimension.evidence" class="dimension-evidence">
              <strong>Evidence:</strong>
              <ul>
                <li v-for="(evidence, idx) in dimension.evidence" :key="idx">{{ evidence }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="tabs">
    <input
      type="radio"
      id="todayTab"
      name="tab-control"
      checked
      v-on:change="selectTab(TypeOfList.Today)"
    />
    <input
      type="radio"
      id="allTimeTab"
      name="tab-control"
      v-on:change="selectTab(TypeOfList.All)"
    />
    <input
      type="radio"
      id="byDaysTab"
      name="tab-control"
      v-on:change="selectTab(TypeOfList.ByDays)"
    />
    <ul>
      <li title="Today">
        <label for="todayTab" role="button"
          ><span>{{ t('today.message') }}</span></label
        >
      </li>
      <li title="All The Time">
        <label for="allTimeTab" role="button"
          ><span>{{ t('allTime.message') }}</span></label
        >
      </li>
      <li title="By Days">
        <label for="byDaysTab" role="button"
          ><span>{{ t('byDays.message') }}</span></label
        >
      </li>
    </ul>

    <div class="slider"><div class="indicator"></div></div>
    <div class="content">
      <section id="todayTabList">
        <TabList
          v-if="activeTab == TypeOfList.Today"
          :type="TypeOfList.Today"
          :showAllStats="false"
        />
      </section>
      <section id="summary">
        <TabList v-if="activeTab == TypeOfList.All" :type="TypeOfList.All" :showAllStats="true" />
      </section>
      <section id="byDaysTabList">
        <ByDays v-if="activeTab == TypeOfList.ByDays" />
      </section>
    </div>
  </div>
  <PomodoroInfo />
  <Review />
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import TabList from '../components/TabList.vue';
import ByDays from '../components/ByDays.vue';
import Review from '../components/Review.vue';
import PomodoroInfo from '../components/PomodoroInfo.vue';
import { openPage } from '../utils/open-page';
import { SettingsTab, TypeOfList } from '../utils/enums';
import { injectStorage } from '../storage/inject-storage';
import { DARK_MODE_DEFAULT, StorageParams } from '../storage/storage-params';
import { applyDarkMode } from '../utils/dark-mode';
import { CredibilityAnalyzer, CredibilityAnalysis } from '../utils/credibilityAnalyzer';
import { PopupMessenger } from '../utils/popupMessenger';
import { ApiConfig } from '../utils/apiConfig';

const { t } = useI18n();
const settingsStorage = injectStorage();

const activeTab = ref<TypeOfList>();
const darkMode = ref<boolean>();

// NEW: Credibility analyzer state
const showAnalysisResult = ref<boolean>(false);
const credibilityAnalysis = ref<CredibilityAnalysis | null>(null);
const analysisError = ref<string | null>(null);
const isAnalyzing = ref<boolean>(false);

onMounted(async () => {
  activeTab.value = TypeOfList.Today;
  darkMode.value = await settingsStorage.getValue(StorageParams.DARK_MODE, DARK_MODE_DEFAULT);
  if (darkMode.value) applyDarkMode(darkMode.value);
});

function selectTab(type: TypeOfList) {
  activeTab.value = type;
}

async function changeDarkMode(value: boolean) {
  await settingsStorage.saveValue(StorageParams.DARK_MODE, value);
  darkMode.value = value;
  applyDarkMode(value);
  updateTab();
}

function updateTab() {
  const tempValue = activeTab.value;
  activeTab.value = undefined;
  setTimeout(() => {
    activeTab.value = tempValue;
  }, 50);
}

// NEW: Analyze page credibility
async function analyzePageCredibility() {
  try {
    isAnalyzing.value = true;
    analysisError.value = null;

    // Check if API key is set
    const hasKey = await ApiConfig.hasGeminiApiKey();
    if (!hasKey) {
      analysisError.value = 'Gemini API key not set. Please configure it in settings.';
      showAnalysisResult.value = true;
      isAnalyzing.value = false;
      return;
    }

    // Get page content from current tab
    const pageContent = await PopupMessenger.getPageContent();

    // Analyze with Gemini
    const analysis = await CredibilityAnalyzer.analyzePageCredibility(
      pageContent.textContent,
      pageContent.url,
      pageContent.title
    );

    credibilityAnalysis.value = analysis;
    showAnalysisResult.value = true;
  } catch (error) {
    analysisError.value = error instanceof Error ? error.message : 'Analysis failed. Please try again.';
    showAnalysisResult.value = true;
  } finally {
    isAnalyzing.value = false;
  }
}

// Helper function to get rating color
function getRatingColor(rating: string): string {
  switch (rating) {
    case 'Excellent':
      return '#27ae60';
    case 'Good':
      return '#2ecc71';
    case 'Fair':
      return '#f39c12';
    case 'Poor':
      return '#e74c3c';
    case 'Very Poor':
      return '#c0392b';
    default:
      return '#95a5a6';
  }
}
</script>

<style scoped>
.headerBlock {
  display: flex;
  justify-content: space-between;
}
.headerBlock .header {
  font-size: 16px;
  padding: 0 0 0 5px;
  display: inline-block;
  font-weight: 600;
  color: #4a4a4a;
  vertical-align: text-bottom;
}

.headerBlock img {
  cursor: pointer;
  padding: 10px;
}
.headerBlock .logo {
  margin-left: 7px;
}
.headerBlock .icons-block {
  float: right;
  margin: 7px 0 0 0;
}

.headerBlock .icons-block a:hover {
  filter: invert(40%) sepia(94%) saturate(3371%) hue-rotate(227deg) brightness(99%) contrast(92%);
}

.headerBlock .icons-block a {
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
}

.headerBlock .icons-block a.analyzing {
  opacity: 0.6;
  cursor: not-allowed;
}

.headerBlock .icons-block a img {
  vertical-align: middle;
  padding-left: 5px !important;
}
.headerBlock .icons-block .dark-mode-icon {
  vertical-align: middle;
}

.headerBlock .icons-block .donate-img {
  padding-top: 0;
  padding-bottom: 0;
}

/* NEW: Analysis Modal Styles */
.analysis-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.error-message {
  color: #c0392b;
  padding: 15px;
  background: #fadbd8;
  border-radius: 4px;
  margin-bottom: 10px;
}

.analysis-container h2 {
  margin-top: 0;
  color: #2c3e50;
}

.score-container {
  border: 3px solid #2ecc71;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
  background: #f8f9fa;
}

.overall-score {
  font-size: 36px;
  font-weight: bold;
  color: #2c3e50;
}

.score-number {
  color: #2c3e50;
}

.score-max {
  font-size: 18px;
  color: #7f8c8d;
}

.rating {
  font-size: 20px;
  font-weight: 600;
  margin: 10px 0;
}

.summary {
  margin: 10px 0 0 0;
  color: #555;
  font-size: 14px;
}

.dimensions {
  margin-top: 20px;
}

.dimensions h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.dimension-item {
  border-left: 4px solid #3498db;
  padding-left: 15px;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ecf0f1;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.dimension-name {
  font-weight: 600;
  color: #2c3e50;
}

.dimension-score {
  font-weight: bold;
  color: #3498db;
}

.dimension-reasoning {
  color: #555;
  font-size: 13px;
  margin: 5px 0;
}

.dimension-evidence {
  margin-top: 8px;
  font-size: 12px;
  color: #7f8c8d;
}

.dimension-evidence strong {
  display: block;
  margin-bottom: 5px;
  color: #555;
}

.dimension-evidence ul {
  margin: 5px 0 0 20px;
  padding: 0;
}

.dimension-evidence li {
  margin-bottom: 3px;
}
</style>
