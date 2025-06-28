import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  BarChart3, 
  Activity, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Network,
  TrendingUp,
  Settings,
  Eye,
  Download,
  RefreshCw,
  Mic,
  Volume2,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  Users,
  FileType,
  LayoutGrid,
  Maximize,
  Minimize,
  XCircle,
  Search,
  Filter,
  FileText,
  Rocket,
  Brain
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { apiMethods } from '../../lib/api';
import { AIModelSelector } from '../ui/AIModelSelector';
import { useWizardStore } from '../../stores/wizardStore';
import { simulationService } from '../../services/simulationService';
import { VoiceInterface } from '../voice/VoiceInterface';
import { VideoInterface } from '../video/VideoInterface';

interface SimulationConfig {
  type: 'comprehensive' | 'quick' | 'stress' | 'custom';
  duration_minutes: number;
  load_factor: number;
  scenarios: string[];
  guild_id: string;
  voice_enabled: boolean;
  model_id: string;
  error_injection: boolean;
  performance_monitoring: boolean;
}

interface EnhancedSimulationLabProps {
  guildId: string;
  agents: any[];
  onResults?: (results: any) => void;
  className?: string;
  advanced?: boolean;
}

export const EnhancedSimulationLab: React.FC<EnhancedSimulationLabProps> = ({
  guildId,
  agents,
  onResults,
  className = '',
  advanced = false
}) => {
  // Get wizard store
  const { blueprint, setSimulationResults } = useWizardStore();
  
  // Simulation state
  const [isRunning, setIsRunning] = useState(false);
  const [currentSimulation, setCurrentSimulation] = useState<any | null>(null);
  const [simulationHistory, setSimulationHistory] = useState<any[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>({});
  
  // UI state
  const [selectedTab, setSelectedTab] = useState<'setup' | 'execution' | 'results' | 'history'>('setup');
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  const [showVideoInterface, setShowVideoInterface] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  
  // Charts and visualization
  const [chartTimeframe, setChartTimeframe] = useState<'realtime' | '1h' | '24h' | '7d'>('realtime');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Form state
  const [config, setConfig] = useState<SimulationConfig>({
    type: 'comprehensive',
    duration_minutes: 5,
    load_factor: 1.0,
    scenarios: ['normal_operation', 'high_load', 'error_injection'],
    guild_id: guildId,
    voice_enabled: false,
    model_id: 'gemini-flash',
    error_injection: false,
    performance_monitoring: true
  });
  
  // WebSocket for real-time updates
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Real-time metrics
  const [agentMetrics, setAgentMetrics] = useState<any[]>([]);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const metricsRef = useRef<HTMLDivElement>(null);
  
  // Connect to simulation service
  useEffect(() => {
    if (guildId) {
      connectToSimulationService();
    }
    
    return () => {
      disconnectFromSimulationService();
    };
  }, [guildId]);
  
  // Load previous simulations from history
  useEffect(() => {
    loadSimulationHistory();
  }, []);
  
  // Connect to simulation service
  const connectToSimulationService = async () => {
    try {
      // Simulate WebSocket connection for development
      console.log("🧪 Connecting to simulation service...");
      setTimeout(() => {
        setIsConnected(true);
        console.log('🧪 Connected to simulation service');
      }, 1000);
    } catch (error) {
      console.error('Failed to connect to simulation service:', error);
      setIsConnected(false);
    }
  };
  
  // Disconnect from simulation service
  const disconnectFromSimulationService = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };
  
  // Load simulation history
  const loadSimulationHistory = async () => {
    try {
      const history = await simulationService.getSimulationHistory(guildId);
      setSimulationHistory(history);
    } catch (error) {
      console.error('Failed to load simulation history:', error);
    }
  };
  
  // Handle form changes
  const handleConfigChange = (key: keyof SimulationConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Add or remove scenario
  const handleScenarioToggle = (scenario: string) => {
    setConfig(prev => {
      if (prev.scenarios.includes(scenario)) {
        return {
          ...prev,
          scenarios: prev.scenarios.filter(s => s !== scenario)
        };
      } else {
        return {
          ...prev,
          scenarios: [...prev.scenarios, scenario]
        };
      }
    });
  };
  
  // Start simulation
  const startSimulation = async () => {
    setIsRunning(true);
    setCurrentSimulation(null);
    setSelectedTab('execution');
    setActiveNodeId(null);
    setExecutionLogs([]);
    
    try {
      // Clear any previous metrics
      setAgentMetrics(agents.map(agent => ({
        id: agent.id || `agent-${Math.random().toString(36).substr(2, 9)}`,
        name: agent.name,
        role: agent.role,
        metrics: {
          requests: 0,
          responses: 0,
          errors: 0,
          avgResponseTime: 0,
          lastResponseTime: 0
        },
        status: 'initializing'
      })));
      
      // Start real-time metrics updates
      startMetricsSimulation();
      
      // Run the simulation
      const results = await simulationService.runSimulation(guildId, {
        ...config,
        agents
      });
      
      // Update state
      setCurrentSimulation(results);
      setSimulationHistory(prev => [results, ...prev]);
      
      // Notify parent component
      if (onResults) {
        onResults(results);
      }
      
      // Update wizard store
      setSimulationResults(results);
      
      // Switch to results tab
      setSelectedTab('results');
    } catch (error) {
      console.error('Simulation failed:', error);
      setExecutionLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Simulation failed: ${
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message?: string }).message
            : 'Unknown error'
        }`,
        details: error
      }]);
    } finally {
      setIsRunning(false);
    }
  };
  
  // Stop simulation
  const stopSimulation = () => {
    setIsRunning(false);
    stopMetricsSimulation();
  };
  
  // Start metrics simulation
  const startMetricsSimulation = () => {
    // Simulate real-time metrics updates
    const interval = setInterval(() => {
      // Update agent metrics
      setAgentMetrics(prev => prev.map(agent => {
        // Simulate realistic metrics changes
        const newRequests = Math.floor(Math.random() * 3);
        const newResponses = Math.floor(Math.random() * newRequests);
        const newErrors = Math.max(0, newRequests - newResponses);
        const responseTime = 200 + Math.random() * 300;
        
        const metrics = {
          requests: agent.metrics.requests + newRequests,
          responses: agent.metrics.responses + newResponses,
          errors: agent.metrics.errors + newErrors,
          avgResponseTime: agent.metrics.avgResponseTime === 0 
            ? responseTime 
            : (agent.metrics.avgResponseTime * 0.8) + (responseTime * 0.2),
          lastResponseTime: newResponses > 0 ? responseTime : agent.metrics.lastResponseTime
        };
        
        // Determine agent status
        let status = 'active';
        if (metrics.errors > metrics.responses * 0.5) {
          status = 'error';
        } else if (Math.random() > 0.95) {
          status = 'paused';
        }
        
        return {
          ...agent,
          metrics,
          status
        };
      }));
      
      // Add execution logs
      if (Math.random() > 0.7) {
        const logTypes = ['info', 'warning', 'error', 'debug'];
        const logLevel = logTypes[Math.floor(Math.random() * logTypes.length)];
        const agent = agents[Math.floor(Math.random() * agents.length)];
        
        setExecutionLogs(prev => [...prev, {
          timestamp: new Date().toISOString(),
          level: logLevel,
          agent: agent.name,
          message: generateLogMessage(logLevel, agent),
          details: { agentId: agent.id || `agent-${Math.random().toString(36).substr(2, 9)}` }
        }]);
      }
      
      // Scroll logs to bottom
      if (metricsRef.current) {
        metricsRef.current.scrollTop = metricsRef.current.scrollHeight;
      }
    }, 1000);
    
    return interval;
  };
  
  // Stop metrics simulation
  const stopMetricsSimulation = () => {
    // Stop metrics simulation interval
  };
  
  // Generate log message
  const generateLogMessage = (level: string, agent: any): string => {
    const infoMessages = [
      `Processing user request`,
      `Analyzing data`,
      `Accessing knowledge base`,
      `Generating response`,
      `Coordinating with other agents`,
      `Retrieving context from memory`,
      `Fetching external data`
    ];
    
    const warningMessages = [
      `Slow response time detected`,
      `Missing context in request`,
      `API rate limit approaching`,
      `Memory usage high`,
      `Incomplete data received`
    ];
    
    const errorMessages = [
      `API connection failed`,
      `Tool execution error`,
      `Memory retrieval failed`,
      `Response generation timeout`,
      `Authentication failed`
    ];
    
    const debugMessages = [
      `Request parameters: {"type": "query", "format": "json"}`,
      `Response size: 2.3KB`,
      `Processing time: 450ms`,
      `Memory usage: 85MB`,
      `Context window: 72% used`
    ];
    
    switch (level) {
      case 'info':
        return `${agent.name}: ${infoMessages[Math.floor(Math.random() * infoMessages.length)]}`;
      case 'warning':
        return `${agent.name}: ${warningMessages[Math.floor(Math.random() * warningMessages.length)]}`;
      case 'error':
        return `${agent.name}: ${errorMessages[Math.floor(Math.random() * errorMessages.length)]}`;
      case 'debug':
        return `${agent.name}: ${debugMessages[Math.floor(Math.random() * debugMessages.length)]}`;
      default:
        return `${agent.name}: Log message`;
    }
  };
  
  // Toggle log expansion
  const toggleLogExpand = (index: number) => {
    setExpandedLogs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Render setup tab
  const renderSetupTab = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Simulation Configuration</h4>
          
          {/* Simulation Type */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Simulation Type</label>
            <select
              value={config.type}
              onChange={(e) => handleConfigChange('type', e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              disabled={isRunning}
            >
              <option value="comprehensive">Comprehensive Test</option>
              <option value="quick">Quick Validation</option>
              <option value="stress">Stress Test</option>
              <option value="custom">Custom Scenarios</option>
            </select>
          </div>

          {/* AI Model */}
          <AIModelSelector
            selectedModelId={config.model_id}
            onSelect={(modelId) => handleConfigChange('model_id', modelId)}
            label="AI Model"
          />
          
          {/* Duration and Load */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Duration (minutes)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={config.duration_minutes}
                onChange={(e) => handleConfigChange('duration_minutes', parseInt(e.target.value))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                disabled={isRunning}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">Load Factor</label>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={config.load_factor}
                onChange={(e) => handleConfigChange('load_factor', parseFloat(e.target.value))}
                className="w-full"
                disabled={isRunning}
              />
              <div className="text-xs text-gray-400 mt-1">{config.load_factor}x</div>
            </div>
          </div>
          
          {/* Advanced Options */}
          <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
            <h5 className="text-sm font-semibold text-white">Advanced Options</h5>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="error_injection"
                checked={config.error_injection}
                onChange={(e) => handleConfigChange('error_injection', e.target.checked)}
                className="mr-2"
                disabled={isRunning}
              />
              <label htmlFor="error_injection" className="text-sm text-gray-300">
                Error Injection (test failure handling)
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="performance_monitoring"
                checked={config.performance_monitoring}
                onChange={(e) => handleConfigChange('performance_monitoring', e.target.checked)}
                className="mr-2"
                disabled={isRunning}
              />
              <label htmlFor="performance_monitoring" className="text-sm text-gray-300">
                Performance Monitoring
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="voice_enabled"
                checked={config.voice_enabled}
                onChange={(e) => handleConfigChange('voice_enabled', e.target.checked)}
                className="mr-2"
                disabled={isRunning}
              />
              <label htmlFor="voice_enabled" className="text-sm text-gray-300">
                Enable Voice Interactions
              </label>
            </div>
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Test Scenarios</h4>
          <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
            {[
              {
                id: 'normal_operation',
                label: 'Normal Operation',
                description: 'Tests standard usage patterns',
                icon: Activity,
                color: 'text-green-400',
                bgColor: 'bg-green-400/20'
              },
              {
                id: 'high_load',
                label: 'High Load',
                description: 'Tests performance under stress',
                icon: TrendingUp,
                color: 'text-yellow-400',
                bgColor: 'bg-yellow-400/20'
              },
              {
                id: 'error_injection',
                label: 'Error Injection',
                description: 'Tests resilience and recovery',
                icon: AlertTriangle,
                color: 'text-orange-400',
                bgColor: 'bg-orange-400/20'
              },
              {
                id: 'complex_queries',
                label: 'Complex Queries',
                description: 'Tests handling of complex requests',
                icon: Search,
                color: 'text-blue-400',
                bgColor: 'bg-blue-400/20'
              },
              {
                id: 'concurrent_users',
                label: 'Concurrent Users',
                description: 'Tests multi-user scenarios',
                icon: Users,
                color: 'text-purple-400',
                bgColor: 'bg-purple-400/20'
              },
              {
                id: 'long_conversations',
                label: 'Long Conversations',
                description: 'Tests long-term memory retention',
                icon: MessageSquare,
                color: 'text-pink-400',
                bgColor: 'bg-pink-400/20'
              }
            ].map((scenario) => (
              <label 
                key={scenario.id}
                className="flex items-center space-x-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={config.scenarios.includes(scenario.id)}
                  onChange={() => handleScenarioToggle(scenario.id)}
                  className="sr-only"
                  disabled={isRunning}
                />
                
                <div className={`w-5 h-5 flex items-center justify-center rounded-md ${
                  config.scenarios.includes(scenario.id)
                    ? scenario.bgColor
                    : 'bg-white/10'
                }`}>
                  {config.scenarios.includes(scenario.id) && (
                    <Check className={`w-3 h-3 ${scenario.color}`} />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center">
                    <scenario.icon className={`w-4 h-4 mr-2 ${scenario.color}`} />
                    <span className="text-white font-medium">{scenario.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{scenario.description}</p>
                </div>
              </label>
            ))}
          </div>
          
          {/* Guild Stats */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-white mb-3">Guild Overview</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Agents</span>
                </div>
                <div className="text-xl font-semibold text-white mt-1">{agents.length}</div>
              </div>
              
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <div className="flex items-center space-x-2">
                  <FileType className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Workflows</span>
                </div>
                <div className="text-xl font-semibold text-white mt-1">
                  {blueprint?.suggested_structure?.workflows?.length || 0}
                </div>
              </div>
              
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-gray-300">Est. Duration</span>
                </div>
                <div className="text-xl font-semibold text-white mt-1">
                  {config.duration_minutes}m
                </div>
              </div>
              
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">Test Scenarios</span>
                </div>
                <div className="text-xl font-semibold text-white mt-1">
                  {config.scenarios.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Run Button */}
      <div className="flex justify-center">
        <HolographicButton
          onClick={startSimulation}
          disabled={config.scenarios.length === 0 || !isConnected || isRunning}
          size="lg"
          glow
          className="px-8"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Running Simulation...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Start Simulation
            </>
          )}
        </HolographicButton>
      </div>
    </div>
  );
  
  // Render execution tab
  const renderExecutionTab = () => (
    <div className="space-y-6">
      {/* Real-time Metrics Panel */}
      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard variant="subtle" className="p-4">
          <h4 className="text-white font-semibold flex items-center mb-3">
            <Activity className="w-5 h-5 text-emerald-400 mr-2" />
            Real-time Agent Metrics
          </h4>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {agentMetrics.map((agent) => (
              <div 
                key={agent.id}
                className={`p-3 rounded-lg border ${
                  agent.status === 'error' ? 'bg-red-500/10 border-red-500/30' :
                  agent.status === 'paused' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      agent.status === 'error' ? 'bg-red-400' :
                      agent.status === 'paused' ? 'bg-yellow-400' :
                      'bg-green-400'
                    }`} />
                    <span className="text-white font-medium">{agent.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{agent.role}</span>
                </div>
                
                <div className="grid grid-cols-4 gap-2 mt-2 text-center">
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-xs text-gray-400">Requests</div>
                    <div className="text-sm text-white">{agent.metrics.requests}</div>
                  </div>
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-xs text-gray-400">Responses</div>
                    <div className="text-sm text-white">{agent.metrics.responses}</div>
                  </div>
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-xs text-gray-400">Errors</div>
                    <div className="text-sm text-red-400">{agent.metrics.errors}</div>
                  </div>
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-xs text-gray-400">Resp Time</div>
                    <div className="text-sm text-blue-400">
                      {Math.round(agent.metrics.avgResponseTime)}ms
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {agentMetrics.length === 0 && (
            <div className="text-center text-gray-400 py-6">
              <Settings className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No metrics available yet. Start the simulation to see real-time data.</p>
            </div>
          )}
        </GlassCard>
        
        <GlassCard variant="subtle" className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold flex items-center">
              <FileText className="w-5 h-5 text-blue-400 mr-2" />
              Execution Logs
            </h4>
            
            {/* Log Filter Buttons */}
            <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
              <button
                className="text-gray-300 hover:text-white text-xs px-2 py-1 rounded"
              >
                All
              </button>
              <button
                className="text-gray-300 hover:text-white text-xs px-2 py-1 rounded"
              >
                Info
              </button>
              <button
                className="text-gray-300 hover:text-white text-xs px-2 py-1 rounded"
              >
                Errors
              </button>
            </div>
          </div>
          
          <div 
            ref={metricsRef}
            className="space-y-2 max-h-60 overflow-y-auto text-sm scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-white/20"
          >
            {executionLogs.map((log, index) => (
              <div 
                key={index}
                className={`p-2 rounded-lg ${
                  log.level === 'error' ? 'bg-red-500/10 border border-red-500/30' :
                  log.level === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                  log.level === 'debug' ? 'bg-blue-500/10 border border-blue-500/30' :
                  'bg-white/5 border border-white/10'
                }`}
              >
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleLogExpand(index)}
                >
                  <div className="flex items-center">
                    {log.level === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 mr-2" />}
                    {log.level === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-400 mr-2" />}
                    {log.level === 'info' && <Check className="w-4 h-4 text-emerald-400 mr-2" />}
                    {log.level === 'debug' && <Settings className="w-4 h-4 text-blue-400 mr-2" />}
                    
                    <span className={`${
                      log.level === 'error' ? 'text-red-300' :
                      log.level === 'warning' ? 'text-yellow-300' :
                      log.level === 'debug' ? 'text-blue-300' :
                      'text-white'
                    }`}>{log.message}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {expandedLogs[index] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>
                
                {expandedLogs[index] && (
                  <div className="mt-2 pl-6 text-xs text-gray-400 space-y-1">
                    <div className="flex">
                      <span className="w-20">Timestamp:</span>
                      <span>{new Date(log.timestamp).toISOString()}</span>
                    </div>
                    <div className="flex">
                      <span className="w-20">Level:</span>
                      <span>{log.level}</span>
                    </div>
                    {log.agent && (
                      <div className="flex">
                        <span className="w-20">Agent:</span>
                        <span>{log.agent}</span>
                      </div>
                    )}
                    {log.details && (
                      <div>
                        <span className="w-20">Details:</span>
                        <pre className="mt-1 p-2 bg-black/20 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {executionLogs.length === 0 && (
              <div className="text-center text-gray-400 py-6">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No logs available yet. Start the simulation to see execution logs.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
      
      {/* Status and Controls Panel */}
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">Simulation Active</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300">
              <span className="font-medium">
                {Math.floor(executionLogs.length / 5)}s
              </span> elapsed
            </span>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <HolographicButton
            variant="outline"
            size="sm"
            onClick={() => setShowVoiceInterface(!showVoiceInterface)}
          >
            <Volume2 className={`w-4 h-4 ${showVoiceInterface ? 'text-purple-400' : ''}`} />
          </HolographicButton>
          
          <HolographicButton
            onClick={stopSimulation}
            variant="primary"
            size="sm"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Simulation
          </HolographicButton>
        </div>
      </div>
      
      {/* Performance Visualization */}
      <GlassCard variant="subtle" className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-semibold flex items-center">
            <BarChart3 className="w-5 h-5 text-purple-400 mr-2" />
            Performance Metrics
          </h4>
          
          <div className="flex space-x-2">
            {/* Timeframe Selector */}
            <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
              {['realtime', '1h', '24h', '7d'].map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => setChartTimeframe(timeframe as any)}
                  className={`text-xs px-2 py-1 rounded ${
                    chartTimeframe === timeframe 
                      ? 'bg-purple-500/30 text-purple-300' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {timeframe === 'realtime' ? 'Live' : timeframe}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 rounded bg-white/5 text-gray-400 hover:text-white"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <div className={`grid ${isFullscreen ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
          {/* Response Time Chart */}
          <div className={`bg-white/5 p-3 rounded-lg border border-white/10 ${isFullscreen ? 'col-span-3' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Response Time (ms)</span>
              <span className="text-xs text-gray-400">by Agent</span>
            </div>
            
            <div className="h-32 flex items-end space-x-1">
              {agentMetrics.map((agent) => (
                <div key={agent.id} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500/30 hover:bg-blue-500/50 transition-all rounded-t"
                    style={{ height: `${Math.min(100, agent.metrics.avgResponseTime / 10)}%` }}
                  />
                  <div className="text-xs text-gray-400 mt-1 truncate w-full text-center">
                    {agent.name.split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Success Rate Chart */}
          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Success Rate (%)</span>
              <span className="text-xs text-gray-400">
                Avg: {Math.round(agentMetrics.reduce(
                  (acc, agent) => acc + (
                    agent.metrics.requests === 0 ? 100 : 
                    (agent.metrics.responses / agent.metrics.requests) * 100
                  ),
                  0
                ) / Math.max(1, agentMetrics.length))}%
              </span>
            </div>
            
            <div className="h-32 flex items-end space-x-1">
              {agentMetrics.map((agent) => {
                const successRate = agent.metrics.requests === 0 
                  ? 100 
                  : (agent.metrics.responses / agent.metrics.requests) * 100;
                
                return (
                  <div key={agent.id} className="flex-1 flex flex-col items-center">
                    <div 
                      className={`w-full ${
                        successRate > 90 ? 'bg-green-500/30 hover:bg-green-500/50' :
                        successRate > 70 ? 'bg-yellow-500/30 hover:bg-yellow-500/50' :
                        'bg-red-500/30 hover:bg-red-500/50'
                      } transition-all rounded-t`}
                      style={{ height: `${successRate}%` }}
                    />
                    <div className="text-xs text-gray-400 mt-1 truncate w-full text-center">
                      {agent.name.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Request Volume Chart */}
          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Request Volume</span>
              <span className="text-xs text-gray-400">
                Total: {agentMetrics.reduce((acc, agent) => acc + agent.metrics.requests, 0)}
              </span>
            </div>
            
            <div className="h-32 flex items-end space-x-1">
              {agentMetrics.map((agent) => {
                const maxRequests = Math.max(
                  ...agentMetrics.map(a => a.metrics.requests),
                  1
                );
                const heightPercent = (agent.metrics.requests / maxRequests) * 100;
                
                return (
                  <div key={agent.id} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-purple-500/30 hover:bg-purple-500/50 transition-all rounded-t"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <div className="text-xs text-gray-400 mt-1 truncate w-full text-center">
                      {agent.name.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
  
  // Render results tab
  const renderResultsTab = () => (
    <div className="space-y-6">
      {currentSimulation ? (
        <>
          {/* Success Banner */}
          <div className={`p-4 rounded-lg ${
            currentSimulation.overall_success
              ? 'bg-green-500/20 border border-green-500/30'
              : 'bg-yellow-500/20 border border-yellow-500/30'
          }`}>
            <div className="flex items-center">
              {currentSimulation.overall_success ? (
                <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-yellow-400 mr-3" />
              )}
              <div>
                <h3 className={`text-lg font-semibold ${
                  currentSimulation.overall_success ? 'text-green-300' : 'text-yellow-300'
                }`}>
                  {currentSimulation.overall_success 
                    ? 'Simulation Completed Successfully' 
                    : 'Simulation Completed with Warnings'}
                </h3>
                <p className="text-white">
                  Execution time: {currentSimulation.execution_time.toFixed(2)}s • 
                  {' '}{currentSimulation.workflow_metrics.total_operations} operations • 
                  {' '}{currentSimulation.workflow_metrics.success_rate}% success rate
                </p>
              </div>
            </div>
          </div>
          
          {/* Performance Metrics */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="text-sm text-gray-300 mb-1">Avg Response Time</div>
              <div className="text-2xl font-bold text-white flex items-center">
                {currentSimulation.workflow_metrics.average_response_time_ms}
                <span className="text-sm text-gray-400 ml-1">ms</span>
              </div>
              <div className={`text-xs ${
                currentSimulation.workflow_metrics.average_response_time_ms < 500 
                  ? 'text-green-400' 
                  : 'text-yellow-400'
              } mt-1`}>
                {currentSimulation.workflow_metrics.average_response_time_ms < 500 
                  ? 'Excellent' 
                  : 'Good'}
              </div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="text-sm text-gray-300 mb-1">Success Rate</div>
              <div className="text-2xl font-bold text-white">
                {currentSimulation.workflow_metrics.success_rate}%
              </div>
              <div className={`text-xs ${
                currentSimulation.workflow_metrics.success_rate > 95 
                  ? 'text-green-400' 
                  : currentSimulation.workflow_metrics.success_rate > 85
                  ? 'text-yellow-400'
                  : 'text-red-400'
              } mt-1`}>
                {currentSimulation.workflow_metrics.success_rate > 95 
                  ? 'Production Ready' 
                  : currentSimulation.workflow_metrics.success_rate > 85
                  ? 'Needs Optimization'
                  : 'Requires Attention'}
              </div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="text-sm text-gray-300 mb-1">Total Operations</div>
              <div className="text-2xl font-bold text-white">
                {currentSimulation.workflow_metrics.total_operations}
              </div>
              <div className="text-xs text-blue-400 mt-1">
                {Math.round(currentSimulation.workflow_metrics.total_operations / currentSimulation.execution_time)} ops/sec
              </div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="text-sm text-gray-300 mb-1">Peak Load</div>
              <div className="text-2xl font-bold text-white">
                {currentSimulation.workflow_metrics.peak_concurrent_operations}
              </div>
              <div className="text-xs text-purple-400 mt-1">
                Concurrent operations
              </div>
            </div>
          </div>
          
          {/* Agent Responses and Insights */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Agent Responses */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Agent Performance</h4>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {currentSimulation.agent_responses.map((agent: any, index: number) => (
                  <GlassCard 
                    key={index} 
                    variant="subtle" 
                    className="p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          agent.success ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                        <h5 className="text-white font-medium">{agent.agent_name}</h5>
                      </div>
                      <span className="text-xs text-gray-400">
                        {agent.execution_time.toFixed(2)}s
                      </span>
                    </div>
                    
                    <div className="bg-white/5 p-3 rounded-lg text-sm text-gray-300 mb-2">
                      {agent.response}
                    </div>
                    
                    <div>
                      <button
                        onClick={() => setActiveNodeId(activeNodeId === `agent-${index}` ? null : `agent-${index}`)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
                      >
                        {activeNodeId === `agent-${index}` ? (
                          <ChevronDown className="w-3 h-3 mr-1" />
                        ) : (
                          <ChevronRight className="w-3 h-3 mr-1" />
                        )}
                        View thought process
                      </button>
                      
                      {activeNodeId === `agent-${index}` && (
                        <div className="mt-2 pl-4 border-l-2 border-blue-500/30 space-y-1">
                          {agent.thought_process.map((thought: string, thoughtIndex: number) => (
                            <div key={thoughtIndex} className="text-xs text-gray-400 flex">
                              <span className="text-blue-400 mr-2">{thoughtIndex + 1}.</span>
                              {thought}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
            
            {/* Insights and Recommendations */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">AI Insights</h4>
              
              <div className="space-y-3">
                {/* Insights */}
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <h5 className="text-blue-300 flex items-center mb-3">
                    <Brain className="w-4 h-4 mr-2" />
                    System Analysis
                  </h5>
                  
                  <div className="space-y-2">
                    {currentSimulation.insights.map((insight: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Recommendations */}
                <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                  <h5 className="text-purple-300 flex items-center mb-3">
                    <Zap className="w-4 h-4 mr-2" />
                    Optimization Recommendations
                  </h5>
                  
                  <div className="space-y-2">
                    {currentSimulation.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2 text-sm">
                        <Zap className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Export and Share */}
                <div className="flex space-x-3 mt-4">
                  <HolographicButton
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </HolographicButton>
                  
                  <HolographicButton
                    variant="primary"
                    className="flex-1"
                    glow
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Deploy to Production
                  </HolographicButton>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Results Yet</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Run a simulation to see detailed performance metrics and AI-powered insights
          </p>
          
          <HolographicButton
            onClick={() => setSelectedTab('setup')}
            variant="outline"
          >
            Set Up Simulation
          </HolographicButton>
        </div>
      )}
    </div>
  );
  
  // Render history tab
  const renderHistoryTab = () => (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-white">Simulation History</h4>
      
      {simulationHistory.length > 0 ? (
        <div className="space-y-3">
          {simulationHistory.map((simulation, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedHistory(simulation);
                setCurrentSimulation(simulation);
                setSelectedTab('results');
              }}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg ${
                  simulation.overall_success 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                } flex items-center justify-center`}>
                  {simulation.overall_success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                
                <div>
                  <div className="text-white font-medium">
                    Simulation #{index + 1}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center mt-1">
                    <CalendarDays className="w-3 h-3 mr-1" />
                    {new Date(simulation.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center mb-1">
                  <div className="flex items-center mr-3">
                    <Clock className="w-3 h-3 text-blue-400 mr-1" />
                    <span className="text-xs text-gray-300">{simulation.execution_time.toFixed(2)}s</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Activity className="w-3 h-3 text-emerald-400 mr-1" />
                    <span className="text-xs text-gray-300">
                      {simulation.workflow_metrics.success_rate}%
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400">
                  {simulation.agent_responses.length} agents • {simulation.workflow_metrics.total_operations} operations
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No History Yet</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Run your first simulation to start building a history of performance metrics and insights
          </p>
        </div>
      )}
    </div>
  );
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
          <span className="text-white font-medium">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          
          {isRunning && (
            <span className="ml-3 text-yellow-400 flex items-center">
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              Simulation running...
            </span>
          )}
        </div>
        
        {/* Tab Selector */}
        <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
          {['setup', 'execution', 'results', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`px-4 py-1.5 rounded-md text-sm ${
                selectedTab === tab 
                  ? 'bg-white/10 text-white font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
              disabled={tab === 'execution' && !isRunning}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        {/* View Options */}
        <div className="flex items-center space-x-3">
          {advanced && (
            <HolographicButton
              variant="ghost"
              size="sm"
              onClick={() => setShowVideoInterface(!showVideoInterface)}
            >
              <Cpu className={`w-4 h-4 ${showVideoInterface ? 'text-pink-400' : ''}`} />
            </HolographicButton>
          )}
          
          <HolographicButton
            variant="ghost"
            size="sm"
            onClick={() => setShowVoiceInterface(!showVoiceInterface)}
          >
            <Volume2 className={`w-4 h-4 ${showVoiceInterface ? 'text-purple-400' : ''}`} />
          </HolographicButton>
          
          <HolographicButton
            variant="ghost"
            size="sm"
          >
            <LayoutGrid className="w-4 h-4" />
          </HolographicButton>
        </div>
      </div>
      
      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {selectedTab === 'setup' && renderSetupTab()}
          {selectedTab === 'execution' && renderExecutionTab()}
          {selectedTab === 'results' && renderResultsTab()}
          {selectedTab === 'history' && renderHistoryTab()}
        </motion.div>
      </AnimatePresence>
      
      {/* Voice Interface */}
      {showVoiceInterface && (
        <VoiceInterface
          agentId="simulation-agent"
          agentName="Simulation Agent"
          isVisible={true}
          onCommand={(command) => {
            console.log('Voice command received:', command);
            setExecutionLogs(prev => [...prev, {
              timestamp: new Date().toISOString(),
              level: 'info',
              agent: 'User',
              message: `Voice command: ${command}`,
              details: { type: 'voice_command' }
            }]);
          }}
        />
      )}
      
      {/* Video Interface */}
      {showVideoInterface && advanced && (
        <VideoInterface
          agentId="simulation-agent"
          agentName="Simulation Agent"
          isVisible={true}
          onVideoGenerated={(videoUrl) => {
            console.log('Video generated:', videoUrl);
            setExecutionLogs(prev => [...prev, {
              timestamp: new Date().toISOString(),
              level: 'info',
              agent: 'System',
              message: 'Video response generated successfully',
              details: { type: 'video_response', url: videoUrl }
            }]);
          }}
        />
      )}
    </div>
  );
};

// Helper component for Check icon
const Check = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);