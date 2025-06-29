import axios from 'axios';
import { Blueprint } from '../types';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { 
  AgentNodeData, 
  TriggerNodeData, 
  ActionNodeData, 
  ConditionNodeData,
  DelayNodeData,
  NodeData,
  CanvasEdge
} from '../types/canvas';

// Icons are imported dynamically in React components,
// here we just store their names as strings
import { 
  Bot, 
  BarChart,
  MessageSquare,
  DollarSign,
  Sparkles,
  Settings,
  Users,
  Heart,
  Database,
  FileText,
  Share2,
  Mail,
  Brain,
  Target,
  Play,
  Clock,
  Globe,
  Workflow,
  Zap,
  Rocket
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Helper functions for canvas generation
const getAgentIcon = (role: string) => {
  const roleKeywords = {
    'analyst': BarChart,
    'support': MessageSquare,
    'sales': DollarSign,
    'marketing': Sparkles,
    'finance': DollarSign,
    'operations': Settings,
    'hr': Users,
    'customer': Heart,
    'data': Database,
    'content': FileText,
    'social': Share2,
    'email': Mail,
    'report': FileText,
    'intelligence': Brain,
    'specialist': Target,
  };

  // Find matching role keyword
  for (const keyword in roleKeywords) {
    if (role.toLowerCase().includes(keyword)) {
      return roleKeywords[keyword as keyof typeof roleKeywords];
    }
  }

  return Bot;
};

const getAgentColor = (index: number) => {
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-violet-500 to-purple-500',
    'from-indigo-500 to-blue-500',
  ];
  return colors[index % colors.length];
};

const getAgentPersonality = (role: string) => {
  const personalities = {
    'analyst': 'Data-driven, analytical, precise with strategic insights',
    'support': 'Empathetic, patient, solution-focused with customer care',
    'sales': 'Persuasive, relationship-focused, results-oriented',
    'marketing': 'Creative, brand-conscious, engagement-focused',
    'finance': 'Detail-oriented, compliance-focused, accuracy-driven',
    'operations': 'Efficient, process-oriented, optimization-focused',
  };
  
  // Find matching personality
  for (const keyword in personalities) {
    if (role.toLowerCase().includes(keyword)) {
      return personalities[keyword as keyof typeof personalities];
    }
  }
  
  return 'Professional, intelligent, and goal-oriented';
};

const getWorkflowIcon = (triggerType: string) => {
  const triggerIcons = {
    'schedule': Clock,
    'webhook': Globe,
    'manual': Play,
    'event': Zap,
  };
  return triggerIcons[triggerType as keyof typeof triggerIcons] || Workflow;
};

const getWorkflowColor = (triggerType: string) => {
  const triggerColors = {
    'schedule': 'from-blue-500 to-indigo-500',
    'webhook': 'from-green-500 to-emerald-500',
    'manual': 'from-purple-500 to-violet-500',
    'event': 'from-yellow-500 to-orange-500',
  };
  return triggerColors[triggerType as keyof typeof triggerColors] || 'from-gray-500 to-slate-500';
};

const mapTriggerTypeToActionType = (triggerType: string): ActionNodeData['actionType'] => {
  const mapping = {
    'schedule': 'database',
    'webhook': 'api',
    'manual': 'notification',
    'event': 'webhook',
  };
  return mapping[triggerType as keyof typeof mapping] || 'api';
};

/**
 * Service for managing canvas operations
 */
export const canvasService = {
  /**
   * Generate canvas nodes and edges from a blueprint
   */
  generateCanvasFromBlueprint: async (blueprint: Blueprint): Promise<{ nodes: Node<NodeData>[], edges: CanvasEdge[] }> => {
    console.log('🎨 Generating canvas from blueprint:', blueprint.id);
    
    // Get API base URL from environment or use default
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
      (import.meta.env.DEV ? 'http://localhost:3000' : 'https://genesisOS-backend-production.up.railway.app');
    
    try {
      // Try to use the orchestrator service if available
      console.log('Attempting to generate canvas from blueprint via orchestrator:', API_BASE_URL);
      try {
        const response = await axios.post(`${API_BASE_URL}/api/canvas/generate`, { blueprint });
        console.log('✅ Canvas generated successfully via orchestrator');
        return response.data;
      } catch (error) {
        console.warn('⚠️ Orchestrator service unavailable:', error);
        throw error;
      }
    } catch (error) {
      console.warn('⚠️ Orchestrator service unavailable, falling back to client-side generation');
      // Fall back to client-side generation if orchestrator is unavailable
      return generateCanvasLocally(blueprint);
    }
  },
  
  /**
   * Execute a workflow based on canvas nodes and edges
   */
  executeWorkflow: async (
    flowId: string, 
    nodes: Node<NodeData>[], 
    edges: CanvasEdge[],
    context: Record<string, any> = {}
  ): Promise<{ executionId: string }> => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      console.log('Attempting to execute workflow via orchestrator:', API_BASE_URL);
      
      const response = await axios.post(`${API_BASE_URL}/api/workflow/execute`, {
        flowId,
        nodes,
        edges,
        context
      });
      
      return {
        executionId: response.data.executionId
      };
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      throw error;
    }
  },
  
  /**
   * Get workflow execution status
   */
  getExecutionStatus: async (executionId: string): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/execution/${executionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get execution status:', error);
      throw error;
    }
  }
};

/**
 * Generate canvas nodes and edges locally (client-side fallback)
 */
function generateCanvasLocally(blueprint: Blueprint): { nodes: Node<NodeData>[], edges: CanvasEdge[] } {
  if (!blueprint || !blueprint.suggested_structure) {
    throw new Error('Invalid blueprint structure');
  }
  
  console.log('🎨 Generating canvas locally from blueprint:', blueprint.id);
  
  const nodes: Node<NodeData>[] = [];
  const edges: CanvasEdge[] = [];
  
  // Create trigger node
  const triggerNode: Node<TriggerNodeData> = {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 50, y: 200 },
    data: {
      label: 'Guild Activation',
      triggerType: 'manual',
      description: `Initiates the ${blueprint.suggested_structure.guild_name} workflow`,
      icon: Rocket,
      color: 'from-emerald-500 to-teal-500',
      status: 'ready',
      config: {
        // Default configuration for manual trigger
        activationMessage: `Starting ${blueprint.suggested_structure.guild_name} workflow`
      }
    } as TriggerNodeData,
  };
  nodes.push(triggerNode);
  
  // Create agent nodes with smart layout algorithm
  blueprint.suggested_structure.agents.forEach((agent, index) => {
    const angle = (index * 2 * Math.PI) / blueprint.suggested_structure.agents.length;
    const radius = 300;
    const centerX = 500;
    const centerY = 300;
    
    const agentNode: Node<AgentNodeData> = {
      id: `agent-${index + 1}`,
      type: 'agent',
      position: { 
        x: centerX + Math.cos(angle) * radius, 
        y: centerY + Math.sin(angle) * radius 
      },
      data: {
        label: agent.name,
        role: agent.role,
        description: agent.description,
        tools: agent.tools_needed,
        personality: getAgentPersonality(agent.role),
        icon: getAgentIcon(agent.role),
        color: getAgentColor(index),
        status: 'ready'
      } as AgentNodeData,
    };
    nodes.push(agentNode);

    // Create connections between agents and trigger
    if (index === 0) {
      const edge: CanvasEdge = {
        id: `trigger-agent-${index + 1}`,
        source: 'trigger-1',
        target: `agent-${index + 1}`,
        type: 'smoothstep',
        animated: true, 
        style: { stroke: '#10b981', strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
        sourceHandle: null,
        targetHandle: null
      };
      edges.push(edge);
    }

    // Create connections between agents
    if (index > 0) {
      const edge: CanvasEdge = {
        id: `agent-${index}-agent-${index + 1}`,
        source: `agent-${index}`,
        target: `agent-${index + 1}`,
        type: 'smoothstep',
        animated: true, 
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
        sourceHandle: null,
        targetHandle: null
      };
      edges.push(edge);
    }
  });

  // Create workflow action nodes
  blueprint.suggested_structure.workflows.forEach((workflow, index) => {
    const workflowNode: Node<ActionNodeData> = {
      id: `workflow-${index + 1}`,
      type: 'action',
      position: { 
        x: 200 + (index * 400), 
        y: 600 
      },
      data: {
        label: workflow.name,
        description: workflow.description,
        actionType: mapTriggerTypeToActionType(workflow.trigger_type),
        icon: getWorkflowIcon(workflow.trigger_type),
        color: getWorkflowColor(workflow.trigger_type),
        status: 'pending',
        validation: null,
        metrics: null,
        config: {
          // Default configuration based on action type
          method: workflow.trigger_type === 'webhook' ? 'POST' : undefined,
          url: workflow.trigger_type === 'webhook' ? '/api/webhook' : undefined,
          schedule: workflow.trigger_type === 'schedule' ? '0 9 * * *' : undefined, // 9 AM daily
          event: workflow.trigger_type === 'event' ? 'data_updated' : undefined
        }
      } as ActionNodeData,
    };
    nodes.push(workflowNode);

    // Connect agents to workflows intelligently
    if (blueprint.suggested_structure.agents.length > 0) {
      const targetAgentIndex = Math.min(index + 1, blueprint.suggested_structure.agents.length);
      const edge: CanvasEdge = {
        id: `agent-${targetAgentIndex}-workflow-${index + 1}`,
        source: `agent-${targetAgentIndex}`,
        target: `workflow-${index + 1}`,
        type: 'smoothstep',
        animated: true, 
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
        sourceHandle: null,
        targetHandle: null
      };
      edges.push(edge);
    }
  });

  console.log('✅ Canvas generated locally with', nodes.length, 'nodes and', edges.length, 'edges');
  return { nodes, edges };
}