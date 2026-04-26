// src/utils/credibilityAnalyzer.ts

import { ApiConfig } from './apiConfig';

/**
 * Interface for dimension scores
 */
export interface DimensionScore {
  name: string;
  score: number; // 0-10
  reasoning: string;
  evidence: string[];
}

/**
 * Interface for complete credibility analysis
 */
export interface CredibilityAnalysis {
  overallScore: number; // 0-10
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor';
  dimensions: DimensionScore[];
  summary: string;
  timestamp: number;
}

/**
 * Analyzes webpage credibility using Gemini AI
 */
export class CredibilityAnalyzer {
  private static readonly GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

  /**
   * Main method to analyze page credibility
   */
  static async analyzePageCredibility(pageContent: string, pageUrl: string, pageTitle: string): Promise<CredibilityAnalysis> {
    // Get the API key
    const apiKey = await ApiConfig.getGeminiApiKey();

    if (!apiKey) {
      throw new Error('Gemini API key not configured. Please set it in extension settings.');
    }

    // Build the analysis prompt
    const prompt = this.buildAnalysisPrompt(pageContent, pageUrl, pageTitle);

    // Call Gemini API
    const response = await this.callGeminiAPI(apiKey, prompt);

    // Parse the response
    const analysis = this.parseGeminiResponse(response);

    return analysis;
  }

  /**
   * Builds the prompt for Gemini
   */
  private static buildAnalysisPrompt(pageContent: string, pageUrl: string, pageTitle: string): string {
    return `
You are a credibility assessment expert. Analyze the following webpage content and provide credibility scores for each of the 8 dimensions below.

WEBPAGE INFORMATION:
- URL: ${pageUrl}
- Title: ${pageTitle}
- Content (first 3000 chars): ${pageContent.substring(0, 3000)}

ANALYZE THESE 8 DIMENSIONS (score each 0-10):

1. **Evidence & Sources** (Weight: 25%)
   - Are claims backed by verifiable sources?
   - Can you trace them to originals?
   - Do multiple independent sources agree?

2. **Author Credibility** (Weight: 20%)
   - Is the creator qualified to speak on this?
   - What's their reputation?
   - Have they been reliable before?

3. **Conflicts of Interest & Incentives** (Weight: 20%)
   - What does the creator gain if you believe them?
   - Are conflicts disclosed?
   - Any undisclosed funding or sponsorships?

4. **Transparency & Methodology** (Weight: 15%)
   - Can you see how they reached their conclusion?
   - Is reasoning visible or hidden?
   - Is fact/opinion clearly separated?

5. **Uncertainty & Humility** (Weight: 10%)
   - Does the creator admit what they don't know?
   - How confident are they?
   - Are alternatives acknowledged?

6. **Opposing Perspectives** (Weight: 5%)
   - Are other credible viewpoints fairly represented?
   - Are counterarguments engaged?
   - Is legitimate expert disagreement acknowledged?

7. **Emotional Appeal vs. Evidence** (Weight: 3%)
   - Does persuasion rely on emotion or evidence?
   - Is the tone proportional to the facts?
   - Is there sensationalism or alarmism?

8. **Applicability & Currency** (Weight: 2%)
   - Is this information current and relevant?
   - Does it apply to the reader's context?
   - Is there overgeneralization?

RESPONSE FORMAT (CRITICAL - MUST FOLLOW EXACTLY):
Return ONLY valid JSON with no additional text:
{
  "overallScore": <number 0-10>,
  "rating": "<Excellent|Good|Fair|Poor|Very Poor>",
  "summary": "<2-3 sentence summary of credibility assessment>",
  "dimensions": [
    {
      "name": "Evidence & Sources",
      "score": <0-10>,
      "reasoning": "<1-2 sentences explaining the score>",
      "evidence": ["<specific finding 1>", "<specific finding 2>", "<specific finding 3>"]
    },
    ... (repeat for all 8 dimensions)
  ]
}

Be objective. Base scores on actual content analysis, not personal opinion.
`;
  }

  /**
   * Calls the Gemini API
   */
  private static async callGeminiAPI(apiKey: string, prompt: string): Promise<string> {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    const response = await fetch(`${this.GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return text;
  }

  /**
   * Parses the Gemini response into structured data
   */
  private static parseGeminiResponse(response: string): CredibilityAnalysis {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        overallScore: parsed.overallScore,
        rating: parsed.rating,
        dimensions: parsed.dimensions,
        summary: parsed.summary,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      throw new Error('Failed to parse credibility analysis. Please try again.');
    }
  }

  /**
   * Gets a rating description
   */
  static getRatingColor(rating: string): string {
    switch (rating) {
      case 'Excellent':
        return '#27ae60'; // Green
      case 'Good':
        return '#2ecc71'; // Light green
      case 'Fair':
        return '#f39c12'; // Orange
      case 'Poor':
        return '#e74c3c'; // Red
      case 'Very Poor':
        return '#c0392b'; // Dark red
      default:
        return '#95a5a6'; // Gray
    }
  }
}
