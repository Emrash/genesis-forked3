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

/**
 * Service for managing canvas operations
 */
export const canvasService = {
  /**
   * Generate canvas nodes and edges from a blueprint
   */
  generateCanvasFromBlueprint: async (blueprint: Blueprint): Promise<{ nodes: Node<NodeData>[], edges: CanvasEdge[] }> => {
    console.log('🎨 Generating canvas from blueprint:', blueprint.id);
    
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    
    try {
      // Try to use the orchestrator service if available
      console.log('Attempting to generate canvas from blueprint via orchestrator:', API_BASE_URL);
      try {
        const response = await axios.post(`${API_BASE_URL}/generateCanvas`, { blueprint });
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
      
      const response = await axios.post(`${API_BASE_URL}/executeFlow`, {
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
  
  const nodes: Node<NodeData>[] = [];
  const edges: CanvasEdge[] = [];
  
  // Create trigger node
  nodes.push({
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 50, y: 200 },
    data: {
      label: 'Guild Activation',
      triggerType: 'manual',
      description: `Initiates the ${blueprint.suggested_structure.guild_name} workflow`,
      icon: Rocket,
      color: 'from-emerald-500 to-teal-500',
      status: 'ready'
    } as TriggerNodeData,
  });
  
  // Create agent nodes with smart layout algorithm
  blueprint.suggested_structure.agents.forEach((agent, index) => {
    const angle = (index * 2 * Math.PI) / blueprint.suggested_structure.agents.length;
    const radius = 300;
    const centerX = 500;
    const centerY = 300;
    
    // Determine agent icon based on role
    const getAgentIcon = (role: string) => {
      const roleIcons: Record<string, any> = {
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

      // Find a matching role keyword
      const roleKey = Object.keys(roleIcons).find(key => 
        role.toLowerCase().includes(key)
      );

      return roleIcons[roleKey || 'specialist'] || Bot;
    };
    
    // Determine agent color
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
    
    // Determine agent personality
    const getAgentPersonality = (role: string) => {
      const personalities: Record<string, string> = {
        'analyst': 'Data-driven, analytical, precise with strategic insights',
        'support': 'Empathetic, patient, solution-focused with customer care',
        'sales': 'Persuasive, relationship-focused, results-oriented',
        'marketing': 'Creative, brand-conscious, engagement-focused',
        'finance': 'Detail-oriented, compliance-focused, accuracy-driven',
        'operations': 'Efficient, process-oriented, optimization-focused',
      };
      
      const roleKey = Object.keys(personalities).find(key => 
        role.toLowerCase().includes(key)
      );
      
      return personalities[roleKey || 'analyst'] || 'Professional, intelligent, and goal-oriented';
    };
    
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

    // Create intelligent connections between agents and trigger
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

    // Create intelligent connections between agents
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

  // Create workflow action nodes with enhanced layout
  const getWorkflowIcon = (triggerType: string) => {
    const triggerIcons: Record<string, any> = {
      'schedule': Clock,
      'webhook': Globe,
      'manual': Play,
      'event': Zap,
    };
    return triggerIcons[triggerType] || Workflow;
  };

  // Get workflow color
  const getWorkflowColor = (triggerType: string) => {
    const triggerColors: Record<string, string> = {
      'schedule': 'from-blue-500 to-indigo-500',
      'webhook': 'from-green-500 to-emerald-500',
      'manual': 'from-purple-500 to-violet-500',
      'event': 'from-yellow-500 to-orange-500',
    };
    return triggerColors[triggerType] || 'from-gray-500 to-slate-500';
  };

  // Map trigger type to action type
  const mapTriggerTypeToActionType = (triggerType: string): ActionNodeData['actionType'] => {
    const mapping: Record<string, ActionNodeData['actionType']> = {
      'schedule': 'database',
      'webhook': 'api',
      'manual': 'notification',
      'event': 'webhook',
    };
    return mapping[triggerType] || 'api';
  };

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
        config: {}
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

  return { nodes, edges };
}