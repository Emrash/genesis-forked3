import { Blueprint } from '../types';
import { apiMethods } from '../lib/api';

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyA81SV6mvA9ShZasJgcVl4ps-YQm9DrKsc';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-1.5-flash'; // Using flash model to avoid rate limits

/**
 * Service for handling blueprint operations
 */
export const blueprintService = {
  /**
   * Generate a blueprint from user input
   */
  generateBlueprint: async (userInput: string): Promise<Blueprint> => {
    try {
      console.log('🧠 Generating blueprint from user input:', userInput.substring(0, 50) + '...');

      // Try to use agent service first
      try {
        const agentServiceUrl = import.meta.env.VITE_AGENT_SERVICE_URL || 'http://localhost:8001';
        console.log('🤖 Attempting to generate blueprint via agent service:', agentServiceUrl);
        
        const response = await fetch(`${agentServiceUrl}/v1/generate-blueprint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_input: userInput })
        });
        
        if (response.ok) {
          const blueprint = await response.json();
          console.log('✅ Blueprint generated successfully via agent service:', blueprint.id);
          return blueprint;
        } else {
          const errorText = await response.text();
          console.warn('⚠️ Agent service response error:', response.status, errorText);
          throw new Error(`Agent service error: ${response.status}`);
        }
      } catch (agentServiceError) {
        console.warn('⚠️ Agent service unavailable, falling back to direct Gemini API:', agentServiceError);
      }
      
      // First try to use Gemini API directly for better blueprint generation
      try {
        console.log('🧠 Attempting direct Gemini API call for enhanced blueprint generation');
        
        // Create a detailed system prompt for blueprint generation
        const systemPrompt = `You are GenesisOS Blueprint Generator, an expert AI system architect specialized in designing 
AI agent-based systems. Your role is to analyze user goals and create structured blueprints for autonomous digital workforces.

Your output must follow this exact JSON structure:
{
  "id": "blueprint-[unique_id]",
  "user_input": "[original user input]",
  "interpretation": "[your understanding of the user's goal]",
  "suggested_structure": {
    "guild_name": "[appropriate name for this guild]",
    "guild_purpose": "[clear purpose statement]",
    "agents": [
      {
        "name": "[agent name]",
        "role": "[specific role]",
        "description": "[detailed description]",
        "tools_needed": ["[tool1]", "[tool2]", "..."]
      }
    ],
    "workflows": [
      {
        "name": "[workflow name]",
        "description": "[detailed description]",
        "trigger_type": "[manual|schedule|webhook|event]"
      }
    ]
  }
}

Create coherent, business-focused blueprints with:
- 3-5 specialized agents with distinct roles
- 2-3 well-defined workflows
- Appropriate tools for each agent
- Realistic integrations (Slack, Email, Google Sheets, etc.)`;

        // Design the prompt for Gemini
        const prompt = `Create a complete blueprint for an AI-powered digital workforce based on this user goal:

"${userInput}"

Design a system of intelligent AI agents working together to achieve this goal.
Include specialized agents with clear roles, appropriate tools, and workflow automations.`;

        // Call Gemini API directly
        const response = await fetch(`${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Extract JSON from the response
        try {
          // Look for JSON structure in the response
          const jsonStart = generatedText.indexOf('{');
          const jsonEnd = generatedText.lastIndexOf('}') + 1;
          
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            const jsonStr = generatedText.substring(jsonStart, jsonEnd);
            const blueprint = JSON.parse(jsonStr);
            
            // Generate a unique ID if not present
            if (!blueprint.id) {
              blueprint.id = `blueprint-${Date.now()}`;
            }
            
            // Ensure user input is set
            blueprint.user_input = userInput;
            
            // Add status and timestamp if not present
            if (!blueprint.status) {
              blueprint.status = 'pending';
            }
            if (!blueprint.created_at) {
              blueprint.created_at = new Date().toISOString();
            }
            
            console.log('✅ Blueprint generated successfully with Gemini API');
            return blueprint;
          }
        } catch (jsonError) {
          console.error('Failed to parse JSON from Gemini response:', jsonError);
        }
      } catch (geminiError) {
        console.warn('⚠️ Direct Gemini API call failed, falling back to API method:', geminiError);
      }
      
      // Fall back to the API method if direct Gemini call fails
      return await apiMethods.generateBlueprint(userInput.trim());
    } catch (error) {
      console.error('Failed to generate blueprint:', error);
      throw error;
    }
  },
  
  /**
   * Create a sample blueprint for testing
   */
  createSampleBlueprint: (userInput: string): Blueprint => {
    const guildName = getGuildNameFromInput(userInput);
    
    return {
      id: `blueprint-${Date.now()}`,
      user_input: userInput,
      interpretation: `I understand that you want to: ${userInput}. I'll create a comprehensive AI-powered system to accomplish this goal.`,
      suggested_structure: {
        guild_name: guildName,
        guild_purpose: `A powerful AI guild designed to ${userInput}`,
        agents: [
          {
            name: "Data Analyst",
            role: "Analytics Specialist",
            description: "Analyzes data and provides actionable insights",
            tools_needed: ["Google Analytics API", "Database", "Reporting Tools"]
          },
          {
            name: "Content Creator",
            role: "Creative Writer",
            description: "Generates high-quality content based on analytics",
            tools_needed: ["Google Docs", "Grammarly", "Content Management"]
          },
          {
            name: "Outreach Manager",
            role: "Communications Specialist",
            description: "Handles external communications and promotions",
            tools_needed: ["Email API", "Social Media API", "CRM System"]
          }
        ],
        workflows: [
          {
            name: "Weekly Performance Review",
            description: "Analyzes weekly performance metrics and generates reports",
            trigger_type: "schedule"
          },
          {
            name: "Content Production Pipeline",
            description: "Creates and publishes content based on performance data",
            trigger_type: "manual"
          },
          {
            name: "Customer Response System",
            description: "Responds to customer inquiries and feedback",
            trigger_type: "webhook"
          }
        ]
      },
      status: 'pending',
      created_at: new Date().toISOString()
    };
  }
};

/**
 * Generate a guild name from user input
 */
function getGuildNameFromInput(userInput: string): string {
  const keywords = userInput.toLowerCase();
  
  if (keywords.includes('customer') || keywords.includes('support')) {
    return "Customer Success Guild";
  } else if (keywords.includes('sales') || keywords.includes('revenue')) {
    return "Revenue Growth Guild";
  } else if (keywords.includes('marketing') || keywords.includes('content')) {
    return "Marketing Intelligence Guild";
  } else if (keywords.includes('analytics') || keywords.includes('data')) {
    return "Data Intelligence Guild";
  } else if (keywords.includes('finance') || keywords.includes('payment')) {
    return "Financial Operations Guild";
  } else {
    return "Business Automation Guild";
  }
}