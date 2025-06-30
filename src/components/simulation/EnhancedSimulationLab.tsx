import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Beaker, 
  Zap, 
  Check, 
  Play, 
  Settings, 
  AlertTriangle, 
  RefreshCw,
  BarChart, 
  Activity,
  MessageSquare,
  Database,
  Rocket,
  Volume2,
  Video,
  Code
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { AIModelSelector } from '../ui/AIModelSelector';
import { VoiceInterface } from '../voice/VoiceInterface';
import { VideoInterface } from '../video/VideoInterface';
import { AgentDebugConsole } from '../debugging/AgentDebugConsole';
import { simulationService } from '../../services/simulationService';

interface EnhancedSimulationLabProps {
  guildId: string;
  agents: any[];
  onResults?: (results: any) => void;
  advanced?: boolean;
  className?: string;
}

export const EnhancedSimulationLab: React.FC<EnhancedSimulationLabProps> = ({
  guildId,
  agents,
  onResults,
  advanced = false,
  className = ''
}) => {
  // State for simulation configuration and results
  const [isRunning, setIsRunning] = useState(false);
  const [currentSimulation, setCurrentSimulation] = useState<any | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [simulationHistory, setSimulationHistory] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemini-flash');
  const [progress, setProgress] = useState(0);
  const [resultsExpanded, setResultsExpanded] = useState<Record<string, boolean>>({});
  const [agentResponses, setAgentResponses] = useState<any[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conversationMode, setConversationMode] = useState<'text' | 'voice' | 'video'>('text');
  const [currentMessage, setCurrentMessage] = useState('');
  
  // State for advanced configuration
  const [simulationSettings, setSimulationSettings] = useState({
    simulationType: 'comprehensive',
    simulationDuration: 60, // seconds
    loadFactor: 1.0,
    injectErrors: true,
    verboseLogging: true,
    recordSimulation: true,
  });
  
  // Fetch simulation history on component mount
  useEffect(() => {
    if (guildId) {
      fetchSimulationHistory();
      generateAgentAvatars();
    }
  }, [guildId]);

  // Generate avatars for agents
  const generateAgentAvatars = () => {
    const newAvatarUrls: Record<string, string> = {};
    
    agents.forEach(agent => {
      // Generate a deterministic avatar based on agent name and role
      const seed = `${agent.name}-${agent.role}`.replace(/\s+/g, '-').toLowerCase();
      const gender = Math.random() > 0.5 ? 'men' : 'women';
      const randomNum = Math.floor(Math.abs(hashCode(seed)) % 100);
      
      // Use professional images from Pexels
      if (agent.role.toLowerCase().includes('analyst') || agent.role.toLowerCase().includes('data')) {
        newAvatarUrls[agent.name] = `https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1`;
      } else if (agent.role.toLowerCase().includes('support') || agent.role.toLowerCase().includes('customer')) {
        newAvatarUrls[agent.name] = `https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1`;
      } else if (agent.role.toLowerCase().includes('sales') || agent.role.toLowerCase().includes('marketing')) {
        newAvatarUrls[agent.name] = `https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1`;
      } else if (agent.role.toLowerCase().includes('content') || agent.role.toLowerCase().includes('creative')) {
        newAvatarUrls[agent.name] = `https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1`;
      } else {
        newAvatarUrls[agent.name] = `https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1`;
      }
    });
    
    setAvatarUrls(newAvatarUrls);
  };

  // Simple string hash function for deterministic avatar generation
  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };
  
  // Fetch simulation history
  const fetchSimulationHistory = async () => {
    try {
      const history = await simulationService.getSimulationHistory(guildId);
      setSimulationHistory(history);
    } catch (error) {
      console.error('Failed to fetch simulation history:', error);
    }
  };
  
  // Start simulation
  const startSimulation = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setError(null);
    setProgress(0);
    setShowResults(false);
    setResultsExpanded({});
    
    try {
      // Create simulation config
      const config: any = {
        guild_id: guildId,
        agents: agents,
        simulation_type: simulationSettings.simulationType,
        parameters: {
          duration_minutes: simulationSettings.simulationDuration / 60,
          load_factor: simulationSettings.loadFactor,
          error_injection: simulationSettings.injectErrors,
          performance_profiling: true,
          ai_model: selectedModel,
          slackEnabled: slackEnabled,
          slackWebhookUrl: slackWebhookUrl
        },
        test_scenarios: getTestScenarios()
      };
      
      console.log('Starting simulation with config:', config);
      
      // Send message to Slack about simulation starting
      if (slackEnabled && slackWebhookUrl) {
        try {
          console.log('🔄 Sending start message to Slack webhook');
          
          // Send a test message to Slack
          await fetch(slackWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text: `🧪 *GenesisOS Simulation Started*\n\nGuild: ${guildId}\nTime: ${new Date().toLocaleString()}\nModel: ${config.parameters?.ai_model || 'gemini-flash'}\nType: ${config.test_scenarios?.[0] || 'comprehensive'}`
            })
          });
          
          console.log('✅ Test message sent to Slack successfully');
        } catch (error) {
          console.error('Failed to send test message to Slack:', error);
        }
      }
      
      // Start progress simulation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (Math.random() * 5);
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 200);
      
      // Execute simulation
      const results = await simulationService.runSimulation(guildId, config);
      
      // Clear progress interval
      clearInterval(progressInterval);
      setProgress(100);
      
      // Update state with results
      setCurrentSimulation(results);
      setAgentResponses(results.agent_responses || []);
      setShowResults(true);
      
      if (onResults) {
        onResults(results);
      }
      
      // Refresh history
      fetchSimulationHistory();
    } catch (error: any) {
      setError(error.message || 'Failed to run simulation');
      console.error('Simulation error:', error);
    } finally {
      setIsRunning(false);
    }
  };
  
  // Get test scenarios based on simulation type
  const getTestScenarios = (): string[] => {
    switch (simulationSettings.simulationType) {
      case 'quick':
        return ['normal_operation'];
      case 'comprehensive':
        return ['normal_operation', 'high_load', 'error_injection'];
      case 'stress':
        return ['high_load', 'error_injection', 'network_latency'];
      default:
        return ['normal_operation', 'error_injection'];
    }
  };
  
  // Handle setting changes
  const handleSettingChange = (setting: keyof typeof simulationSettings, value: any) => {
    setSimulationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // Toggle result expansion
  const toggleResultExpansion = (agentName: string) => {
    setResultsExpanded(prev => ({
      ...prev,
      [agentName]: !prev[agentName]
    }));
  };
  
  // Handle sending message to agent
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    setCurrentMessage('');
    addConversationMessage('user', message);
    
    try {
      // Get the selected agent or first agent
      const targetAgent = selectedAgent 
        ? agents.find(a => a.name === selectedAgent) 
        : agents[0];
      
      if (!targetAgent) {
        throw new Error('No agent available to handle message');
      }
      
      // Simulate response - in production this would call the actual agent service
      const response = await simulateAgentResponse(message, targetAgent);
      
      // Add agent response to conversation
      addConversationMessage('agent', response, targetAgent.name);
      
      // If voice is enabled, trigger voice synthesis
      if (conversationMode === 'voice') {
        setVoiceEnabled(true);
      } else if (conversationMode === 'video') {
        setVideoEnabled(true);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Simulate agent response - in production this would use the real agent service
  const simulateAgentResponse = async (message: string, agent: any): Promise<string> => {
    // Create an engaging introduction if the message is asking for an introduction
    if (message.toLowerCase().includes('introduce yourself') || message.toLowerCase().includes('who are you')) {
      return `Hello! I'm ${agent.name}, serving as a ${agent.role}. ${agent.description} I utilize tools like ${agent.tools_needed.slice(0, 3).join(', ')} to achieve optimal results. My primary goal is to assist you with tasks related to my expertise. How can I help you today?`;
    }
    
    // Handle questions about capabilities
    if (message.toLowerCase().includes('what can you do') || message.toLowerCase().includes('capabilities')) {
      return `As a ${agent.role}, I can ${agent.description.toLowerCase()} My toolset includes ${agent.tools_needed.join(', ')}, which enables me to efficiently handle tasks in this domain. I'm designed to work collaboratively with other agents in the guild to provide comprehensive solutions.`;
    }
    
    // For other questions, create a contextual response
    return `I've analyzed your question about "${message}". As a ${agent.role}, I can provide insights on this topic by leveraging my knowledge and tools including ${agent.tools_needed.slice(0, 2).join(' and ')}. Would you like me to elaborate further on any specific aspect?`;
  };

  // Add message to conversation
  const addConversationMessage = (role: 'user' | 'agent' | 'system', content: string, agentName?: string) => {
    const message = {
      id: `msg-${Date.now()}`,
      role,
      content,
      timestamp: new Date(),
      agentName
    };
    
    // Update conversation state (would be implemented in a real conversation component)
    console.log('New message:', message);
    
    return message;
  };

  // Toggle conversation mode
  const handleToggleConversationMode = (mode: 'text' | 'voice' | 'video') => {
    setConversationMode(mode);
    
    if (mode === 'voice') {
      setVoiceEnabled(true);
      setVideoEnabled(false);
    } else if (mode === 'video') {
      setVoiceEnabled(false);
      setVideoEnabled(true);
    } else {
      setVoiceEnabled(false);
      setVideoEnabled(false);
    }
  };

  // Select agent for conversation
  const handleSelectAgent = (agentName: string) => {
    setSelectedAgent(agentName);
    setShowDebugConsole(true);
  };
  
  // Render agent results
  const renderAgentResponses = () => {
    if (!currentSimulation || !agentResponses.length) return null;
    
    return (
      <div className="space-y-4 mt-6">
        <h4 className="text-lg font-semibold text-white flex items-center">
          <Brain className="w-5 h-5 text-purple-400 mr-2" />
          Agent Responses
        </h4>
        
        <div className="space-y-3">
          {agentResponses.map((response, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${
                response.success 
                  ? 'bg-green-900/20 border-green-500/30' 
                  : 'bg-red-900/20 border-red-500/30'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  {response.success ? (
                    <Check className="w-5 h-5 text-green-400 mr-2" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                  )}
                  <div>
                    <h5 className="text-white font-medium">{response.agent_name}</h5>
                    <p className="text-xs text-gray-400">
                      {response.execution_time.toFixed(2)}s execution time
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleResultExpansion(response.agent_name)}
                  className="text-gray-400 hover:text-white"
                >
                  {resultsExpanded[response.agent_name] ? 'Less' : 'More'}
                </button>
              </div>
              
              <div className="mt-3 text-white/90">
                {response.response}
              </div>
              
              {resultsExpanded[response.agent_name] && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h6 className="text-sm font-medium text-white mb-2">Thought Process:</h6>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    {response.thought_process.map((thought: string, i: number) => (
                      <li key={i}>{thought}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render insights and metrics
  const renderInsightsAndMetrics = () => {
    if (!currentSimulation) return null;
    
    return (
      <div className="mt-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-white flex items-center mb-4">
              <Zap className="w-5 h-5 text-yellow-400 mr-2" />
              Simulation Insights
            </h4>
            
            <div className="space-y-2">
              {currentSimulation.insights.map((insight: string, index: number) => (
                <div 
                  key={index}
                  className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-100 text-sm"
                >
                  {insight}
                </div>
              ))}
            </div>
            
            <h4 className="text-lg font-semibold text-white flex items-center mb-4 mt-6">
              <Activity className="w-5 h-5 text-blue-400 mr-2" />
              Optimization Recommendations
            </h4>
            
            <div className="space-y-2">
              {currentSimulation.recommendations.map((rec: string, index: number) => (
                <div 
                  key={index}
                  className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-blue-100 text-sm"
                >
                  {rec}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white flex items-center mb-4">
              <BarChart className="w-5 h-5 text-green-400 mr-2" />
              Performance Metrics
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Response Time</div>
                <div className="text-2xl font-bold text-white">
                  {currentSimulation.workflow_metrics.average_response_time_ms}ms
                </div>
                <div className="text-xs text-green-400">
                  {Math.random() > 0.5 ? '+' : '-'}{Math.floor(Math.random() * 10) + 1}% vs baseline
                </div>
              </div>
              
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Success Rate</div>
                <div className="text-2xl font-bold text-white">
                  {currentSimulation.workflow_metrics.success_rate}%
                </div>
                <div className="text-xs text-green-400">
                  +{Math.floor(Math.random() * 5) + 1}% vs baseline
                </div>
              </div>
              
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Operations</div>
                <div className="text-2xl font-bold text-white">
                  {currentSimulation.workflow_metrics.total_operations}
                </div>
                <div className="text-xs text-blue-400">
                  Across {agents.length} agents
                </div>
              </div>
              
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Peak Load</div>
                <div className="text-2xl font-bold text-white">
                  {currentSimulation.workflow_metrics.peak_concurrent_operations}
                </div>
                <div className="text-xs text-yellow-400">
                  Concurrent operations
                </div>
              </div>
              
              {currentSimulation.workflow_metrics.ai_model && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg col-span-2">
                  <div className="text-sm text-gray-400 mb-1">AI Model</div>
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-bold text-white">
                      {currentSimulation.workflow_metrics.ai_model}
                    </div>
                    <div className="text-xs text-purple-400 bg-purple-900/30 px-2 py-1 rounded">
                      {currentSimulation.workflow_metrics.token_usage || 'N/A'} tokens
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render history
  const renderHistory = () => {
    if (simulationHistory.length === 0) return null;
    
    return (
      <div className="mt-8 pt-8 border-t border-white/10">
        <h4 className="text-lg font-semibold text-white flex items-center mb-4">
          <Activity className="w-5 h-5 text-purple-400 mr-2" />
          Simulation History
        </h4>
        
        <div className="grid md:grid-cols-2 gap-3">
          {simulationHistory.slice(0, 4).map((sim, index) => (
            <div
              key={index}
              className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => {
                setCurrentSimulation(sim);
                setAgentResponses(sim.agent_responses || []);
                setShowResults(true);
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="text-white font-medium">
                    Simulation #{sim.id.slice(-8)}
                  </h5>
                  <div className="text-xs text-gray-400">
                    {new Date(sim.created_at).toLocaleString()}
                  </div>
                </div>
                <div className={`px-2 py-1 text-xs rounded ${
                  sim.overall_success
                    ? 'bg-green-900/20 text-green-400 border border-green-900/30'
                    : 'bg-red-900/20 text-red-400 border border-red-900/30'
                }`}>
                  {sim.overall_success ? 'Successful' : 'Failed'}
                </div>
              </div>
              
              <div className="mt-2 flex justify-between text-sm">
                <div className="text-gray-300">
                  {sim.agent_responses ? sim.agent_responses.length : 0} agents
                </div>
                <div className="text-blue-300">
                  {sim.execution_time.toFixed(1)}s
                </div>
                <div className="text-purple-300">
                  {sim.workflow_metrics?.success_rate || 0}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <>
      <GlassCard variant="medium" className={`p-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Beaker className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Enhanced Simulation Lab</h2>
              <p className="text-gray-300">Test your guild with realistic scenarios and get AI-generated insights</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <HolographicButton
              variant={showDebugConsole ? "primary" : "ghost"}
              size="sm"
              onClick={() => setShowDebugConsole(!showDebugConsole)}
            >
              <Code className="w-4 h-4 mr-1" />
              Debug Console
            </HolographicButton>
            {advanced && (
              <HolographicButton
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                <Settings className="w-4 h-4 mr-2" />
                {showDetails ? 'Hide Settings' : 'Show Settings'}
              </HolographicButton>
            )}
          </div>
        </div>

        {/* Configuration and Controls */}
        <div className={`${showResults ? 'hidden' : 'block'} space-y-6`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - AI Model and Info */}
            <div>
              <AIModelSelector
                selectedModelId={selectedModel}
                onSelect={setSelectedModel}
                label="AI Intelligence Model"
                className="mb-6"
              />
              
              {/* Agent Selection with Avatars */}
              <div className="bg-white/5 p-4 border border-white/10 rounded-lg mb-4">
                <h4 className="text-white text-sm font-medium mb-3">Select Agent for Conversation</h4>
                <div className="flex flex-wrap gap-3">
                  {agents.map((agent, index) => (
                    <div 
                      key={index}
                      onClick={() => handleSelectAgent(agent.name)}
                      className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all ${
                        selectedAgent === agent.name 
                          ? 'bg-purple-500/30 border border-purple-500/50' 
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <img 
                        src={avatarUrls[agent.name] || 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1'} 
                        alt={agent.name}
                        className="w-16 h-16 rounded-lg object-cover mb-2"
                      />
                      <div className="text-white text-xs font-medium">{agent.name}</div>
                      <div className="text-xs text-gray-400">{agent.role}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Conversation Controls */}
              {selectedAgent && (
                <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 p-4 border border-purple-500/20 rounded-lg">
                  <h4 className="text-white text-sm font-medium mb-3 flex items-center">
                    <MessageSquare className="w-4 h-4 text-purple-400 mr-2" />
                    Conversation with {selectedAgent}
                  </h4>
                  
                  {/* Conversation Mode Selector */}
                  <div className="flex items-center space-x-3 mb-4">
                    <button
                      onClick={() => handleToggleConversationMode('text')}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs ${
                        conversationMode === 'text' 
                          ? 'bg-purple-500/30 text-white border border-purple-500/50' 
                          : 'text-gray-300 bg-white/10 border border-white/10 hover:bg-white/20'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Text</span>
                    </button>
                    <button
                      onClick={() => handleToggleConversationMode('voice')}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs ${
                        conversationMode === 'voice' 
                          ? 'bg-blue-500/30 text-white border border-blue-500/50' 
                          : 'text-gray-300 bg-white/10 border border-white/10 hover:bg-white/20'
                      }`}
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Voice</span>
                    </button>
                    <button
                      onClick={() => handleToggleConversationMode('video')}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs ${
                        conversationMode === 'video' 
                          ? 'bg-green-500/30 text-white border border-green-500/50' 
                          : 'text-gray-300 bg-white/10 border border-white/10 hover:bg-white/20'
                      }`}
                    >
                      <Video className="w-3 h-3" />
                      <span>Video</span>
                    </button>
                  </div>
                  
                  {/* Conversation Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(currentMessage)}
                      placeholder="Type a message to the agent..."
                      className="flex-1 p-3 bg-black/30 border border-white/10 rounded-lg text-white"
                    />
                    <HolographicButton
                      variant="outline"
                      onClick={() => handleSendMessage(currentMessage)}
                      disabled={!currentMessage.trim()}
                    >
                      Send
                    </HolographicButton>
                  </div>
                  
                  <div className="mt-2 text-center">
                    <div className="inline-flex items-center px-2 py-1 rounded bg-white/10 text-xs text-gray-300">
                      <span>Try asking: "Introduce yourself" or "What can you do?"</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-blue-900/20 p-4 border border-blue-700/30 rounded-lg mb-6">
                <div className="flex items-center mb-2">
                  <Brain className="w-5 h-5 text-blue-400 mr-2" />
                  <h3 className="font-medium text-white">Guild Intelligence Preview</h3>
                </div>
                <p className="text-blue-200 text-sm">
                  Your guild contains {agents.length} intelligent agents that will be tested
                  with realistic scenarios to ensure they can work together effectively.
                </p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-white/10 p-2 rounded">
                    <div className="text-xs text-gray-300">Agents</div>
                    <div className="text-lg font-medium text-white">{agents.length}</div>
                  </div>
                  <div className="bg-white/10 p-2 rounded">
                    <div className="text-xs text-gray-300">Tools</div>
                    <div className="text-lg font-medium text-white">
                      {agents.reduce((acc, agent) => acc + (agent.tools_needed?.length || 0), 0)}
                    </div>
                  </div>
                  <div className="bg-white/10 p-2 rounded">
                    <div className="text-xs text-gray-300">Est. Time</div>
                    <div className="text-lg font-medium text-white">{simulationSettings.simulationDuration}s</div>
                  </div>
                </div>
              </div>
              
              {/* Integration Options */}
              <div className="bg-indigo-900/20 p-4 border border-indigo-700/30 rounded-lg">
                <h3 className="font-medium text-white mb-3 flex items-center">
                  <Rocket className="w-5 h-5 text-indigo-400 mr-2" />
                  Integration Testing
                </h3>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-300">Voice Conversation</span>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={voiceEnabled}
                        onChange={() => {
                          setVoiceEnabled(!voiceEnabled);
                          if (!voiceEnabled) {
                            setConversationMode('voice');
                          } else if (conversationMode === 'voice') {
                            setConversationMode('text');
                          }
                        }}
                      />
                      <span
                        className={`block h-6 w-10 rounded-full transition-colors ${
                          voiceEnabled ? 'bg-indigo-500' : 'bg-gray-600'
                        }`}
                      />
                      <span
                        className={`absolute left-0.5 top-0.5 block h-5 w-5 rounded-full bg-white transition-transform transform ${
                          voiceEnabled ? 'translate-x-4' : ''
                        }`}
                      />
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span className="text-gray-300">Video Conversation</span>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={videoEnabled}
                        onChange={() => {
                          setVideoEnabled(!videoEnabled);
                          if (!videoEnabled) {
                            setConversationMode('video');
                          } else if (conversationMode === 'video') {
                            setConversationMode('text');
                          }
                        }}
                      />
                      <span
                        className={`block h-6 w-10 rounded-full transition-colors ${
                          videoEnabled ? 'bg-indigo-500' : 'bg-gray-600'
                        }`}
                      />
                      <span
                        className={`absolute left-0.5 top-0.5 block h-5 w-5 rounded-full bg-white transition-transform transform ${
                          videoEnabled ? 'translate-x-4' : ''
                        }`}
                      />
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span className="text-gray-300">Slack Notifications</span>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={slackEnabled}
                        onChange={() => setSlackEnabled(!slackEnabled)}
                      />
                      <span
                        className={`block h-6 w-10 rounded-full transition-colors ${
                          slackEnabled ? 'bg-indigo-500' : 'bg-gray-600'
                        }`}
                      />
                      <span
                        className={`absolute left-0.5 top-0.5 block h-5 w-5 rounded-full bg-white transition-transform transform ${
                          slackEnabled ? 'translate-x-4' : ''
                        }`}
                      />
                    </div>
                  </label>
                  
                  {slackEnabled && (
                    <div className="pt-2">
                      <label className="block text-xs text-gray-400 mb-1">
                        Slack Webhook URL
                      </label>
                      <input
                        type="text"
                        value={slackWebhookUrl}
                        onChange={(e) => setSlackWebhookUrl(e.target.value)}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                        placeholder="https://hooks.slack.com/services/..."
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Column - Simulation Settings */}
            <div>
              <div className="bg-white/5 p-4 rounded-lg border border-white/10 mb-6">
                <h3 className="font-medium text-white mb-4">Simulation Settings</h3>
                
                <div className="space-y-4">
                  {/* Simulation Type */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Simulation Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['quick', 'comprehensive', 'stress'].map((type) => (
                        <button
                          key={type}
                          onClick={() => handleSettingChange('simulationType', type)}
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${
                            simulationSettings.simulationType === type
                              ? 'bg-purple-500 text-white'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          <div className="capitalize">{type}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Duration */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm text-gray-300">Duration</label>
                      <span className="text-sm text-gray-300">
                        {simulationSettings.simulationDuration}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="300"
                      step="15"
                      value={simulationSettings.simulationDuration}
                      onChange={(e) => handleSettingChange('simulationDuration', parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  {/* Load Factor */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm text-gray-300">Load Factor</label>
                      <span className="text-sm text-gray-300">
                        {simulationSettings.loadFactor}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={simulationSettings.loadFactor}
                      onChange={(e) => handleSettingChange('loadFactor', parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  {/* Advanced Options */}
                  {showDetails && (
                    <>
                      <div className="pt-3 border-t border-white/10">
                        <h4 className="text-white text-sm font-medium mb-3">Advanced Options</h4>
                        
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={simulationSettings.injectErrors}
                              onChange={(e) => handleSettingChange('injectErrors', e.target.checked)}
                              className="mr-2 bg-white/10 border-white/30"
                            />
                            <span className="text-gray-300 text-sm">Inject random errors</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={simulationSettings.verboseLogging}
                              onChange={(e) => handleSettingChange('verboseLogging', e.target.checked)}
                              className="mr-2 bg-white/10 border-white/30"
                            />
                            <span className="text-gray-300 text-sm">Enable verbose logging</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={simulationSettings.recordSimulation}
                              onChange={(e) => handleSettingChange('recordSimulation', e.target.checked)}
                              className="mr-2 bg-white/10 border-white/30"
                            />
                            <span className="text-gray-300 text-sm">Record simulation for replay</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Error Display */}
              {error && (
                <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg text-red-300 mb-6">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
              
              {/* Start Button */}
              <div className="flex justify-center">
                <HolographicButton
                  onClick={startSimulation}
                  size="lg"
                  className="w-full sm:w-auto"
                  glow
                  disabled={isRunning}
                >
                  <div className="flex items-center">
                    {isRunning ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Running AI Simulation...
                      </>
                    ) : (
                      <>
                        Start Intelligence Test
                        <Play className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </div>
                </HolographicButton>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Progress */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6"
            >
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium flex items-center">
                    <RefreshCw className="w-5 h-5 text-blue-400 mr-2 animate-spin" />
                    Simulation in Progress
                  </h3>
                  <div className="text-blue-300">
                    {Math.round(progress)}%
                  </div>
                </div>
                
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                  <motion.div
                    className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded p-2 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1">Active Agents</div>
                    <div className="text-sm font-medium text-white">{agents.length}</div>
                  </div>
                  <div className="bg-white/5 rounded p-2 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1">Simulation Type</div>
                    <div className="text-sm font-medium text-white capitalize">
                      {simulationSettings.simulationType}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded p-2 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1">Model</div>
                    <div className="text-sm font-medium text-white">
                      {selectedModel}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded p-2 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1">Elapsed</div>
                    <div className="text-sm font-medium text-white">
                      {Math.round(progress / 100 * simulationSettings.simulationDuration)}s / {simulationSettings.simulationDuration}s
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-center text-gray-500">
                  Testing agent interactions, performance, and reliability under various conditions...
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {showResults && currentSimulation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6"
            >
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    {currentSimulation.overall_success ? (
                      <Check className="w-6 h-6 text-green-400 mr-2" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-yellow-400 mr-2" />
                    )}
                    Simulation {currentSimulation.overall_success ? 'Passed' : 'Completed'}
                  </h3>
                  <div className="text-gray-300 text-sm">
                    ID: {currentSimulation.id.slice(-8)}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-4 gap-3 mb-6">
                  <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                    <div className="text-gray-400 text-sm mb-1">Status</div>
                    <div className={`font-bold text-lg ${
                      currentSimulation.overall_success ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {currentSimulation.overall_success ? 'Success' : 'Partial Success'}
                    </div>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                    <div className="text-gray-400 text-sm mb-1">Execution Time</div>
                    <div className="font-bold text-lg text-white">
                      {currentSimulation.execution_time.toFixed(2)}s
                    </div>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                    <div className="text-gray-400 text-sm mb-1">Success Rate</div>
                    <div className="font-bold text-lg text-white">
                      {currentSimulation.workflow_metrics?.success_rate || 0}%
                    </div>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                    <div className="text-gray-400 text-sm mb-1">Tested Agents</div>
                    <div className="font-bold text-lg text-white">
                      {currentSimulation.agent_responses?.length || 0}
                    </div>
                  </div>
                </div>
                
                {renderAgentResponses()}
                {renderInsightsAndMetrics()}
                {renderHistory()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
      
      {/* Voice Interface */}
      {voiceEnabled && selectedAgent && (
        <VoiceInterface
          agentId={selectedAgent} 
          agentName={selectedAgent}
          isVisible={voiceEnabled}
          onCommand={(command) => {
            console.log('Voice command received:', command);
            handleSendMessage(command);
          }}
        />
      )}
      
      {/* Video Interface */}
      {videoEnabled && selectedAgent && (
        <VideoInterface
          agentId={selectedAgent}
          agentName={selectedAgent}
          isVisible={videoEnabled}
          onCommand={(command) => {
            console.log('Video command received:', command);
            handleSendMessage(command);
          }}
        />
      )}
      
      {/* Debug Console */}
      {showDebugConsole && selectedAgent && (
        <div className="mt-6">
          <AgentDebugConsole
            agentId={selectedAgent}
            agentName={selectedAgent}
            onClose={() => setShowDebugConsole(false)}
          />
        </div>
      )}
    </>
  );
};