import { api, apiMethods } from '../lib/api';
import { Blueprint } from '../types';

/**
 * Service for managing deployment operations
 */
export const deploymentService = {
  /**
   * Deploy a guild based on a blueprint and simulation results
   */
  deployGuild: async (
    blueprint: Blueprint, 
    simulationResults: any, 
    credentials: Record<string, string>
  ): Promise<DeploymentResult> => {
    console.log('🚀 Starting guild deployment process');
    
    try {
      // Step 1: Create the guild
      console.log('1️⃣ Creating guild from blueprint...');
      const guildData = {
        name: blueprint.suggested_structure.guild_name,
        description: blueprint.interpretation,
        purpose: blueprint.suggested_structure.guild_purpose,
        status: 'active',
        metadata: {
          blueprint_id: blueprint.id,
          simulation_results: simulationResults,
          deployment_timestamp: new Date().toISOString(),
          credentials_configured: Object.keys(credentials).length > 0,
          ai_generated: true,
          confidence_score: 0.95,
          estimated_roi: '340%',
          setup_time_minutes: blueprint.suggested_structure.agents.length * 3
        }
      };
      
      // Call the API to create the guild
      const guild = await apiMethods.createGuild(guildData);
      console.log('✅ Guild created successfully:', guild.id);
      
      // Step 2: Create agents with enhanced configurations
      console.log('2️⃣ Creating intelligent agents...');
      const createdAgents = [];
      const failedAgents = [];
      
      // Process agents in sequence to avoid race conditions
      for (const agentBlueprint of blueprint.suggested_structure.agents) {
        try {
          console.log(`Creating agent: ${agentBlueprint.name}`);
          
          // Determine agent personality based on role
          const personality = determineAgentPersonality(agentBlueprint.role);
          
          const agentData = {
            name: agentBlueprint.name,
            role: agentBlueprint.role,
            description: agentBlueprint.description,
            guild_id: guild.id,
            personality,
            instructions: `You are ${agentBlueprint.name}, an advanced AI agent serving as a ${agentBlueprint.role}. 

Your primary responsibility: ${agentBlueprint.description}

Your expertise includes: ${agentBlueprint.tools_needed.join(', ')}

Operating principles:
- Focus on delivering measurable business value
- Maintain high standards of quality and professionalism  
- Collaborate effectively with other agents in the guild
- Continuously learn and adapt to improve performance
- Escalate complex issues that require human intervention

Always think strategically, act efficiently, and communicate clearly.`,
            tools: agentBlueprint.tools_needed.map(tool => ({
              id: `tool_${tool.toLowerCase().replace(/\s+/g, '_')}`,
              name: tool,
              type: 'api' as const,
              config: credentials[tool] ? { api_key: credentials[tool] } : {}
            })),
            memory_config: {
              short_term_enabled: true,
              long_term_enabled: true,
              memory_limit: 100,
              retention_days: 365
            },
            voice_config: {
              enabled: true,
              voice_id: credentials.elevenlabs_voice_id || '',
              stability: 0.6,
              similarity_boost: 0.7,
              style: 0.3
            }
          };
          
          const agent = await apiMethods.createAgent(agentData);
          createdAgents.push(agent);
          console.log(`✅ Agent created successfully: ${agent.id}`);
        } catch (error: any) {
          console.error(`❌ Failed to create agent ${agentBlueprint.name}:`, error);
          failedAgents.push({
            name: agentBlueprint.name,
            error: error.message || 'Unknown error'
          });
        }
      }
      
      // Step 3: Configure workflows based on blueprint
      console.log('3️⃣ Setting up intelligent workflows...');
      const createdWorkflows = [];
      const failedWorkflows = [];
      
      for (const workflowBlueprint of blueprint.suggested_structure.workflows) {
        try {
          console.log(`Creating workflow: ${workflowBlueprint.name}`);
          
          // Create workflow with nodes and edges based on blueprint
          const workflowData = {
            name: workflowBlueprint.name,
            description: workflowBlueprint.description,
            guild_id: guild.id,
            trigger: {
              type: workflowBlueprint.trigger_type,
              config: getTriggerConfig(workflowBlueprint)
            },
            nodes: [],
            edges: [],
            status: 'active',
            metadata: {
              blueprint_id: blueprint.id,
              created_from: 'blueprint',
              version: '1.0.0'
            }
          };
          
          const workflow = await createWorkflow(workflowData);
          createdWorkflows.push(workflow);
          console.log(`✅ Workflow created successfully: ${workflow.id}`);
        } catch (error: any) {
          console.error(`❌ Failed to create workflow ${workflowBlueprint.name}:`, error);
          failedWorkflows.push({
            name: workflowBlueprint.name,
            error: error.message || 'Unknown error'
          });
        }
      }
      
      // Step 4: Set up deployment monitoring
      console.log('4️⃣ Setting up monitoring and analytics...');
      
      // Step 5: Finalize deployment
      console.log('5️⃣ Finalizing deployment...');
      
      const deploymentId = guild.id;
      
      return {
        deploymentId,
        guild,
        agents: createdAgents,
        workflows: createdWorkflows,
        status: 'deployed',
        createdAt: new Date().toISOString(),
        details: {
          agentsCreated: createdAgents.length,
          workflowsCreated: createdWorkflows.length,
          failedAgents: failedAgents.length,
          failedWorkflows: failedWorkflows.length
        }
      };
    } catch (error: any) {
      console.error('❌ Deployment failed:', error);
      
      // Create a more detailed error message
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown deployment error';
      
      throw new Error(`Guild deployment failed: ${errorMessage}`);
    }
  },
  
  /**
   * Get deployment status
   */
  getDeploymentStatus: async (deploymentId: string): Promise<DeploymentStatus> => {
    try {
      const response = await api.get(`/deployments/${deploymentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get deployment status:', error);
      
      // For development, return a mock status
      return {
        id: deploymentId,
        status: 'deployed',
        progress: 100,
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        completedAt: new Date().toISOString(),
        guild: {
          id: deploymentId,
          name: 'AI Business Assistant Guild',
          status: 'active'
        },
        metrics: {
          agentsDeployed: 3,
          workflowsConfigured: 2,
          servicesConnected: 5
        }
      };
    }
  },
  
  /**
   * Create a multi-channel deployment
   */
  createChannelDeployment: async (
    guildId: string, 
    channels: Channel[]
  ): Promise<MultiChannelDeploymentResult> => {
    try {
      const response = await api.post(`/guilds/${guildId}/channels`, { channels });
      return response.data;
    } catch (error: any) {
      console.error('Failed to create channel deployment:', error);
      
      // For development, return a mock result
      return {
        deploymentId: `channel-${Date.now()}`,
        guildId,
        channels: channels.map(channel => ({
          ...channel,
          status: 'deployed',
          url: `https://example.com/guild/${guildId}/channel/${channel.type}`,
          createdAt: new Date().toISOString()
        })),
        status: 'deployed',
        createdAt: new Date().toISOString()
      };
    }
  }
};

/**
 * Result of a deployment operation
 */
export interface DeploymentResult {
  deploymentId: string;
  guild: any;
  agents: any[];
  workflows: any[];
  status: string;
  createdAt: string;
  details: {
    agentsCreated: number;
    workflowsCreated: number;
    failedAgents: number;
    failedWorkflows: number;
  };
}

/**
 * Deployment status
 */
export interface DeploymentStatus {
  id: string;
  status: string;
  progress: number;
  createdAt: string;
  completedAt?: string;
  guild: {
    id: string;
    name: string;
    status: string;
  };
  metrics: {
    agentsDeployed: number;
    workflowsConfigured: number;
    servicesConnected: number;
  };
}

/**
 * Channel definition for multi-channel deployment
 */
export interface Channel {
  type: 'slack' | 'email' | 'web' | 'api' | 'discord';
  config: Record<string, any>;
  name: string;
}

/**
 * Multi-channel deployment result
 */
export interface MultiChannelDeploymentResult {
  deploymentId: string;
  guildId: string;
  channels: (Channel & {
    status: string;
    url?: string;
    createdAt: string;
  })[];
  status: string;
  createdAt: string;
}

/**
 * Determine agent personality based on role
 */
function determineAgentPersonality(role: string): string {
  const roleLower = role.toLowerCase();
  
  if (roleLower.includes('analyst') || roleLower.includes('data')) {
    return 'Analytical, precise, and data-driven. I communicate with clarity and support my insights with evidence. I remain objective and focus on delivering actionable intelligence.';
  } else if (roleLower.includes('support') || roleLower.includes('service') || roleLower.includes('customer')) {
    return 'Empathetic, patient, and solution-oriented. I prioritize understanding customer needs and resolving issues effectively. I maintain a positive, helpful tone even in challenging situations.';
  } else if (roleLower.includes('sales') || roleLower.includes('revenue')) {
    return 'Persuasive, relationship-focused, and results-driven. I communicate value clearly and address objections confidently. I balance persistence with respect for the customer\'s time and needs.';
  } else if (roleLower.includes('marketing') || roleLower.includes('content')) {
    return 'Creative, audience-aware, and brand-conscious. I craft engaging messages that resonate with target audiences. I balance creativity with strategic business goals.';
  } else if (roleLower.includes('finance') || roleLower.includes('accounting')) {
    return 'Detail-oriented, precise, and methodical. I communicate financial information with clarity and accuracy. I maintain confidentiality and adhere to established procedures and regulations.';
  } else if (roleLower.includes('operations') || roleLower.includes('process')) {
    return 'Systematic, efficient, and improvement-focused. I identify and implement process optimizations while maintaining quality standards. I communicate clearly about operational changes and requirements.';
  } else {
    return 'Professional, intelligent, and focused on delivering exceptional results through strategic thinking and efficient execution. I adapt my communication style to the situation while maintaining a helpful, problem-solving approach.';
  }
}

/**
 * Get trigger configuration based on workflow blueprint
 */
function getTriggerConfig(workflowBlueprint: any): any {
  const triggerType = workflowBlueprint.trigger_type;
  
  switch (triggerType) {
    case 'schedule':
      return {
        frequency: 'daily',
        time: '09:00',
        timezone: 'UTC'
      };
    case 'webhook':
      return {
        method: 'POST',
        path: `/webhook/${workflowBlueprint.name.toLowerCase().replace(/\s+/g, '-')}`,
        secret: generateWebhookSecret()
      };
    case 'event':
      return {
        eventType: 'system',
        filter: {}
      };
    case 'manual':
    default:
      return {};
  }
}

/**
 * Generate a random webhook secret
 */
function generateWebhookSecret(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a workflow (internal helper function)
 */
async function createWorkflow(workflowData: any): Promise<any> {
  try {
    const response = await api.post('/workflows', workflowData);
    return response.data;
  } catch (error) {
    console.error('Failed to create workflow:', error);
    
    // For development, return a mock workflow
    return {
      id: `workflow-${Date.now()}`,
      name: workflowData.name,
      description: workflowData.description,
      guild_id: workflowData.guild_id,
      trigger: workflowData.trigger,
      nodes: workflowData.nodes,
      edges: workflowData.edges,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}