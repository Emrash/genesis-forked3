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
     
      // Attempt to generate blueprint using comprehensive service discovery
      const services = [
        // Try agent service
        async () => {
          const agentServiceUrl = import.meta.env.VITE_AGENT_SERVICE_URL || 'http://localhost:8001';
          console.log('🤖 Attempting to generate blueprint via agent service:', agentServiceUrl);
          
          // Try multiple endpoints that might be valid
          const endpoints = [
            '/generate-blueprint',
            '/v1/generate-blueprint',
            '/api/generate-blueprint'
          ];
          
          for (const endpoint of endpoints) {
            try {
              console.log(`🔄 Trying agent service endpoint: ${agentServiceUrl}${endpoint}`);
              
              const response = await fetch(`${agentServiceUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_input: userInput })
              });
              
              if (response.ok) {
                const blueprint = await response.json();
                console.log('✅ Blueprint generated successfully via agent service:', blueprint.id);
                return blueprint;
              } else {
                console.warn(`⚠️ Agent service endpoint ${endpoint} returned: ${response.status}`);
              }
            } catch (error) {
              console.warn(`⚠️ Agent service endpoint ${endpoint} error:`, error);
            }
          }
          throw new Error('All agent service endpoints failed');
        },
        
        // Try orchestrator service
        async () => {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
          console.log('🔄 Attempting to generate blueprint via orchestrator:', apiBaseUrl);
          
          // Try multiple endpoints that might be valid
          const endpoints = [
            '/api/wizard/generate-blueprint',
            '/generateBlueprint',
            '/wizard/generate-blueprint'
          ];

          for (const endpoint of endpoints) {
            try {
              console.log(`🔄 Trying orchestrator endpoint: ${apiBaseUrl}${endpoint}`);
              
              const response = await fetch(`${apiBaseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_input: userInput })
              });
              
              if (response.ok) {
                const blueprint = await response.json();
                console.log('✅ Blueprint generated successfully via orchestrator:', blueprint.id);
                return blueprint;
              } else {
                console.warn(`⚠️ Orchestrator endpoint ${endpoint} returned: ${response.status}`);
              }
            } catch (error) {
              console.warn(`⚠️ Orchestrator endpoint ${endpoint} error:`, error);
            }
          }
          }
          throw new Error('All orchestrator endpoints failed');
        },
        
        // Direct Gemini API call
        async () => {
          console.log('🧠 Attempting direct Gemini API call for enhanced blueprint generation');
          const blueprint = await generateBlueprintDirectly(userInput);
          console.log('✅ Blueprint generated successfully with Gemini API:', blueprint.id);
          return blueprint;
        }
      ];
      
      // Try each service in sequence
      for (const serviceCall of services) {
        try {
          return await serviceCall();
        } catch (error) {
          console.warn('Service call failed, trying next service:', error.message);
        }
      }
      
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

      // If all services fail, create a fallback blueprint
      console.error('❌ All blueprint generation methods failed');
      return createSampleBlueprint(userInput);
    } catch (error) {
      console.error('Failed to generate blueprint:', error);
      
      // Always provide a result rather than throwing to maintain UX
      console.log('Creating emergency fallback blueprint');
      return createSampleBlueprint(userInput);
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
      interpretation: `I understand that you want to: ${userInput}. I'll create a comprehensive AI-powered system to accomplish this goal using specialized AI agents and automated workflows.`,
      suggested_structure: {
        guild_name: guildName,
        guild_purpose: `A powerful AI guild designed to accomplish: ${userInput}`,
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
            name: "Weekly Analytics Review",
            description: "Analyzes weekly metrics and generates detailed reports",
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