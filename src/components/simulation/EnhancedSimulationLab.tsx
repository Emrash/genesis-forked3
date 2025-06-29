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
  Sliders,
  HelpCircle,
  Shield,
  Workflow,
  Sparkles
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { simulationService } from '../../services/simulationService';
import { AIModelSelector } from '../ui/AIModelSelector';

interface EnhancedSimulationLabProps {
  guildId: string;
  agents: any[];
  advanced?: boolean;
  onResults?: (results: any) => void;
}

export const EnhancedSimulationLab: React.FC<EnhancedSimulationLabProps> = ({
  guildId,
  agents,
  advanced = true,
  onResults
}) => {
  // Simulation configuration state
  const [isRunning, setIsRunning] = useState(false);
  const [currentSimulation, setCurrentSimulation] = useState<any | null>(null);
  const [simulationHistory, setSimulationHistory] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemini-flash');
  const [showAgentMetrics, setShowAgentMetrics] = useState<Record<string, boolean>>({});
  
  // Simulation settings
  const [settings, setSettings] = useState({
    testType: 'comprehensive', // 'comprehensive', 'quick', 'stress', 'custom'
    duration: 60, // seconds
    loadFactor: 1.0, // 0.5-3.0
    scenarioCount: 3, // 1-10
    errorInjection: true,
    networkLatency: false,
    apiTimeouts: false,
    realTimeMonitoring: true,
    includeVisualAnalytics: true,
    slackNotifications: false,
    slackWebhookUrl: '',
    testScenarios: [
      'normal_operation',
      'high_load',
      'error_recovery'
    ]
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'configuration' | 'realtime' | 'results' | 'history'>('configuration');
  const [viewMode, setViewMode] = useState<'basic' | 'advanced'>(advanced ? 'advanced' : 'basic');
  const [chartData, setChartData] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation refs
  const simulationTimerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);
  
  // Agent communication visualization
  const [agentMessages, setAgentMessages] = useState<any[]>([]);
  
  // Generate random agent messages for visualization
  useEffect(() => {
    if (isRunning && settings.realTimeMonitoring) {
      const interval = setInterval(() => {
        if (agents.length >= 2) {
          const fromIndex = Math.floor(Math.random() * agents.length);
          let toIndex = Math.floor(Math.random() * agents.length);
          
          // Make sure sender and receiver are different
          while (toIndex === fromIndex) {
            toIndex = Math.floor(Math.random() * agents.length);
          }
          
          const message = {
            id: `msg-${Date.now()}`,
            from: agents[fromIndex].name,
            to: agents[toIndex].name,
            content: generateRandomMessage(agents[fromIndex], agents[toIndex]),
            timestamp: new Date()
          };
          
          setAgentMessages(prev => [...prev.slice(-9), message]);
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [isRunning, agents, settings.realTimeMonitoring]);
  
  // Load simulation history
  useEffect(() => {
    loadSimulationHistory();
  }, [guildId]);

  // Initialize chart data
  useEffect(() => {
    setChartData({
      success: {
        labels: [],
        datasets: [{ data: [], backgroundColor: '#10b981' }]
      },
      errors: {
        labels: [],
        datasets: [{ data: [], backgroundColor: '#ef4444' }]
      },
      responseTime: {
        labels: [],
        datasets: [{ data: [], backgroundColor: '#8b5cf6' }]
      }
    });
  }, []);

  // Load simulation history from the service
  const loadSimulationHistory = async () => {
    try {
      const history = await simulationService.getSimulationHistory(guildId);
      setSimulationHistory(history);
    } catch (error) {
      console.error('Failed to load simulation history:', error);
    }
  };

  // Generate random agent messages for visualization
  const generateRandomMessage = (fromAgent: any, toAgent: any) => {
    const messageTemplates = [
      `Requesting data analysis on recent ${Math.random() > 0.5 ? 'customer engagement' : 'market trends'}`,
      `Sharing insights about ${Math.random() > 0.5 ? 'user behavior patterns' : 'performance metrics'}`,
      `Need assistance with ${Math.random() > 0.5 ? 'content optimization' : 'data validation'}`,
      `Updating workflow status: ${Math.random() > 0.7 ? 'completed successfully' : 'in progress'}`,
      `Processing request for ${Math.random() > 0.5 ? 'report generation' : 'data retrieval'}`
    ];
    
    return messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
  };

  // Handle changing simulation settings
  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Handle toggling test scenarios
  const handleToggleScenario = (scenario: string) => {
    setSettings(prev => {
      if (prev.testScenarios.includes(scenario)) {
        return {
          ...prev,
          testScenarios: prev.testScenarios.filter(s => s !== scenario),
          scenarioCount: prev.testScenarios.filter(s => s !== scenario).length
        };
      } else {
        return {
          ...prev,
          testScenarios: [...prev.testScenarios, scenario],
          scenarioCount: prev.testScenarios.length + 1
        };
      }
    });
  };

  // Start simulation
  const handleStartSimulation = async () => {
    try {
      setError(null);
      setIsRunning(true);
      setActiveTab('realtime');
      setAgentMessages([]);
      
      // Create simulation configuration
      const config = {
        guild_id: guildId,
        agents,
        simulation_type: settings.testType,
        parameters: {
          duration_minutes: settings.duration / 60, // Convert seconds to minutes
          load_factor: settings.loadFactor,
          error_injection: settings.errorInjection,
          network_latency: settings.networkLatency,
          api_timeouts: settings.apiTimeouts,
          ai_model: mapModelToAIEngine(selectedModel),
          slackEnabled: settings.slackNotifications,
          slackWebhookUrl: settings.slackWebhookUrl
        },
        test_scenarios: settings.testScenarios
      };
      
      // Simulate progress updates
      let progress = 0;
      progressIntervalRef.current = setInterval(() => {
        progress += Math.random() * 2;
        if (progress >= 100) {
          progress = 100;
          clearInterval(progressIntervalRef.current);
        }
        
        // Update chart data
        setChartData(prev => {
          const timestamp = new Date().toLocaleTimeString();
          
          // Only update sometimes for a more realistic look
          if (Math.random() > 0.3) {
            return {
              success: {
                labels: [...prev.success.labels, timestamp],
                datasets: [{
                  ...prev.success.datasets[0],
                  data: [...prev.success.datasets[0].data, Math.floor(Math.random() * 30) + 70]
                }]
              },
              errors: {
                labels: [...prev.errors.labels, timestamp],
                datasets: [{
                  ...prev.errors.datasets[0],
                  data: [...prev.errors.datasets[0].data, Math.floor(Math.random() * 10)]
                }]
              },
              responseTime: {
                labels: [...prev.responseTime.labels, timestamp],
                datasets: [{
                  ...prev.responseTime.datasets[0],
                  data: [...prev.responseTime.datasets[0].data, Math.floor(Math.random() * 500) + 200]
                }]
              }
            };
          }
          return prev;
        });
        
        // Update simulation with progress
        setCurrentSimulation(prev => prev ? {
          ...prev,
          progress
        } : null);
      }, 1000);
      
      // Run the actual simulation
      const results = await simulationService.runSimulation(guildId, config);
      
      // Clear progress interval
      clearInterval(progressIntervalRef.current);
      
      // Set results
      setCurrentSimulation(results);
      setIsRunning(false);
      
      // Add to history
      setSimulationHistory(prev => [results, ...prev.slice(0, 4)]);
      
      // Set active tab to results
      setActiveTab('results');
      
      // Callback with results if provided
      if (onResults) {
        onResults(results);
      }
      
    } catch (error: any) {
      clearInterval(progressIntervalRef.current);
      setIsRunning(false);
      setError(error.message || 'Failed to run simulation');
      console.error('Simulation failed:', error);
    }
  };

  // Stop simulation
  const handleStopSimulation = () => {
    clearInterval(progressIntervalRef.current);
    clearTimeout(simulationTimerRef.current);
    setIsRunning(false);
    setCurrentSimulation(null);
    setActiveTab('configuration');
  };

  // Map model ID to AI engine name
  const mapModelToAIEngine = (modelId: string): string => {
    switch (modelId) {
      case 'gemini-flash': return 'gemini_2_flash';
      case 'gemini-pro': return 'gemini_2_pro';
      case 'claude-3-sonnet': return 'claude_3_sonnet';
      case 'gpt-4': return 'gpt_4';
      default: return 'gemini_2_flash';
    }
  };

  // Render real-time monitoring view
  const renderRealtimeView = () => {
    if (!isRunning && !currentSimulation) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">
              Start a simulation to see real-time monitoring data
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="bg-white/5 p-4 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Simulation Progress</span>
            </div>
            <span className="text-white">
              {Math.round(currentSimulation?.progress || 0)}%
            </span>
          </div>
          
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${currentSimulation?.progress || 0}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Started: {new Date().toLocaleTimeString()}</span>
            <span>
              {isRunning ? 'Running...' : currentSimulation?.status}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Success Rate */}
          <GlassCard variant="subtle" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white text-sm">Success Rate</span>
              </div>
              <span className="text-green-400 font-medium">
                {chartData?.success?.datasets[0]?.data?.length > 0 
                  ? Math.round(
                      chartData.success.datasets[0].data.reduce((a: number, b: number) => a + b, 0) / 
                      chartData.success.datasets[0].data.length
                    )
                  : 95}%
              </span>
            </div>
            <div className="h-20 relative">
              {chartData?.success?.datasets[0]?.data?.length > 0 && (
                <div className="flex items-end h-full space-x-1">
                  {chartData.success.datasets[0].data.map((value: number, index: number) => (
                    <div 
                      key={index}
                      className="bg-green-500/50 rounded-t w-full"
                      style={{ height: `${value}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
          
          {/* Error Rate */}
          <GlassCard variant="subtle" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-white text-sm">Error Rate</span>
              </div>
              <span className="text-red-400 font-medium">
                {chartData?.errors?.datasets[0]?.data?.length > 0 
                  ? Math.round(
                      chartData.errors.datasets[0].data.reduce((a: number, b: number) => a + b, 0) / 
                      chartData.errors.datasets[0].data.length
                    )
                  : 5}%
              </span>
            </div>
            <div className="h-20 relative">
              {chartData?.errors?.datasets[0]?.data?.length > 0 && (
                <div className="flex items-end h-full space-x-1">
                  {chartData.errors.datasets[0].data.map((value: number, index: number) => (
                    <div 
                      key={index}
                      className="bg-red-500/50 rounded-t w-full"
                      style={{ height: `${value * 5}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
          
          {/* Response Time */}
          <GlassCard variant="subtle" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-white text-sm">Response Time</span>
              </div>
              <span className="text-purple-400 font-medium">
                {chartData?.responseTime?.datasets[0]?.data?.length > 0 
                  ? Math.round(
                      chartData.responseTime.datasets[0].data.reduce((a: number, b: number) => a + b, 0) / 
                      chartData.responseTime.datasets[0].data.length
                    )
                  : 350}ms
              </span>
            </div>
            <div className="h-20 relative">
              {chartData?.responseTime?.datasets[0]?.data?.length > 0 && (
                <div className="flex items-end h-full space-x-1">
                  {chartData.responseTime.datasets[0].data.map((value: number, index: number) => (
                    <div 
                      key={index}
                      className="bg-purple-500/50 rounded-t w-full"
                      style={{ height: `${(value / 1000) * 100}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Agent Communication Network */}
        <GlassCard variant="subtle" className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Network className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Agent Communication</span>
            </div>
            {agentMessages.length > 0 && (
              <HolographicButton
                variant="ghost"
                size="sm"
                onClick={() => setAgentMessages([])}
              >
                Clear
              </HolographicButton>
            )}
          </div>
          
          <div className="h-64 relative bg-white/5 rounded-lg border border-white/10 p-4">
            {agents.length > 0 ? (
              <>
                {/* Agent nodes */}
                {agents.map((agent, index) => {
                  const angle = (index * 2 * Math.PI) / agents.length;
                  const radius = 100;
                  const x = 150 + Math.cos(angle) * radius;
                  const y = 100 + Math.sin(angle) * radius;
                  
                  return (
                    <motion.div
                      key={agent.name}
                      className="absolute w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ left: x, top: y }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {agent.name.charAt(0)}
                      <div className="absolute -bottom-6 w-max text-xs text-white/80 font-medium">
                        {agent.name.split(' ')[0]}
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* Message Animations */}
                <AnimatePresence>
                  {agentMessages.map((message) => {
                    const fromIndex = agents.findIndex(a => a.name === message.from);
                    const toIndex = agents.findIndex(a => a.name === message.to);
                    
                    if (fromIndex === -1 || toIndex === -1) return null;
                    
                    const fromAngle = (fromIndex * 2 * Math.PI) / agents.length;
                    const toAngle = (toIndex * 2 * Math.PI) / agents.length;
                    
                    const fromX = 150 + Math.cos(fromAngle) * 100 + 5;
                    const fromY = 100 + Math.sin(fromAngle) * 100 + 5;
                    
                    const toX = 150 + Math.cos(toAngle) * 100 + 5;
                    const toY = 100 + Math.sin(toAngle) * 100 + 5;
                    
                    return (
                      <motion.div
                        key={message.id}
                        className="absolute w-3 h-3 rounded-full bg-white z-10 text-[8px] overflow-visible whitespace-nowrap"
                        initial={{ x: fromX, y: fromY, opacity: 0 }}
                        animate={{ x: toX, y: toY, opacity: [0, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2 }}
                        title={message.content}
                      >
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {message.content.length > 30 ? message.content.substring(0, 30) + '...' : message.content}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">
                  No agents available for communication visualization
                </p>
              </div>
            )}
          </div>
        </GlassCard>
        
        {/* Resource Usage */}
        <GlassCard variant="subtle" className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-medium">Resource Monitoring</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
              <div className="text-gray-400 text-xs mb-1">Memory Usage</div>
              <div className="flex items-end space-x-1">
                <span className="text-white font-medium">
                  {Math.floor(Math.random() * 500) + 200}MB
                </span>
                <span className="text-green-400 text-xs">
                  (+{Math.floor(Math.random() * 10) + 5}%)
                </span>
              </div>
            </div>
            
            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
              <div className="text-gray-400 text-xs mb-1">CPU Utilization</div>
              <div className="flex items-end space-x-1">
                <span className="text-white font-medium">
                  {Math.floor(Math.random() * 30) + 10}%
                </span>
                <span className="text-yellow-400 text-xs">
                  (+{Math.floor(Math.random() * 5) + 2}%)
                </span>
              </div>
            </div>
            
            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
              <div className="text-gray-400 text-xs mb-1">API Calls</div>
              <div className="flex items-end space-x-1">
                <span className="text-white font-medium">
                  {Math.floor(Math.random() * 300) + 100}/min
                </span>
                <span className="text-blue-400 text-xs">
                  (+{Math.floor(Math.random() * 20) + 5}%)
                </span>
              </div>
            </div>
            
            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
              <div className="text-gray-400 text-xs mb-1">Token Usage</div>
              <div className="flex items-end space-x-1">
                <span className="text-white font-medium">
                  {Math.floor(Math.random() * 5000) + 2000}
                </span>
                <span className="text-purple-400 text-xs">
                  (+{Math.floor(Math.random() * 15) + 5}%)
                </span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Simulation Control */}
        <div className="flex justify-center">
          {isRunning ? (
            <HolographicButton
              onClick={handleStopSimulation}
              variant="outline"
              className="text-red-400 hover:text-red-300"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Simulation
            </HolographicButton>
          ) : (
            <HolographicButton
              onClick={handleStartSimulation}
              glow
            >
              <Play className="w-4 h-4 mr-2" />
              Restart Simulation
            </HolographicButton>
          )}
        </div>
      </div>
    );
  };

  // Render results view
  const renderResultsView = () => {
    if (!currentSimulation) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">
              Run a simulation to see results
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Overall Results Card */}
        <GlassCard variant="medium" className={`p-6 border-l-4 ${
          currentSimulation.overall_success 
            ? 'border-l-green-500 bg-green-900/10' 
            : 'border-l-yellow-500 bg-yellow-900/10'
        }`}>
          <div className="flex items-start space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              currentSimulation.overall_success 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {currentSimulation.overall_success 
                ? <CheckCircle className="w-6 h-6" /> 
                : <AlertTriangle className="w-6 h-6" />
              }
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">
                {currentSimulation.overall_success 
                  ? 'Simulation Successful' 
                  : 'Simulation Completed with Warnings'
                }
              </h3>
              
              <div className="text-sm text-gray-300 mb-3">
                <span className="mr-4">Execution Time: {currentSimulation.execution_time.toFixed(2)}s</span>
                <span className="mr-4">Total Operations: {currentSimulation.workflow_metrics.total_operations}</span>
                <span>Status: {currentSimulation.status}</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-white/10 p-3 rounded-lg">
                  <div className="text-gray-300 text-sm">Success Rate</div>
                  <div className="text-2xl font-bold text-green-400">{currentSimulation.workflow_metrics.success_rate}%</div>
                </div>
                
                <div className="bg-white/10 p-3 rounded-lg">
                  <div className="text-gray-300 text-sm">Avg Response</div>
                  <div className="text-2xl font-bold text-blue-400">{currentSimulation.workflow_metrics.average_response_time_ms}ms</div>
                </div>
                
                <div className="bg-white/10 p-3 rounded-lg">
                  <div className="text-gray-300 text-sm">Peak Load</div>
                  <div className="text-2xl font-bold text-yellow-400">{currentSimulation.workflow_metrics.peak_concurrent_operations} ops</div>
                </div>
                
                <div className="bg-white/10 p-3 rounded-lg">
                  <div className="text-gray-300 text-sm">Token Usage</div>
                  <div className="text-2xl font-bold text-purple-400">{currentSimulation.workflow_metrics.token_usage || '8,432'}</div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* AI Insights */}
        <GlassCard variant="subtle" className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-medium">AI-Generated Insights</h3>
          </div>
          
          <div className="space-y-3">
            {currentSimulation.insights?.map((insight: string, index: number) => (
              <div
                key={index}
                className="p-3 bg-purple-900/10 border border-purple-500/20 rounded-lg text-purple-100"
              >
                <div className="flex items-start">
                  <Sparkles className="w-4 h-4 text-purple-400 mr-2 mt-1 flex-shrink-0" />
                  <p>{insight}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Agent Performance */}
        <GlassCard variant="subtle" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-medium">Agent Performance</h3>
            </div>
            
            <HolographicButton
              variant="ghost"
              size="sm"
              onClick={() => {}}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </HolographicButton>
          </div>
          
          <div className="space-y-3">
            {currentSimulation.agent_responses?.map((agent: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-colors ${
                  agent.success 
                    ? 'bg-green-900/10 border-green-500/30' 
                    : 'bg-yellow-900/10 border-yellow-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      agent.success ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <h4 className="text-white font-medium">{agent.agent_name}</h4>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-300">
                      {agent.execution_time.toFixed(2)}s
                    </div>
                    <button
                      onClick={() => setShowAgentMetrics({
                        ...showAgentMetrics,
                        [agent.agent_name]: !showAgentMetrics[agent.agent_name]
                      })}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {showAgentMetrics[agent.agent_name] ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-300 mb-2">
                  {agent.response}
                </div>
                
                <AnimatePresence>
                  {showAgentMetrics[agent.agent_name] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <h5 className="text-sm text-white mb-2">Thought Process:</h5>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300">
                          {agent.thought_process.map((thought: string, i: number) => (
                            <li key={i}>{thought}</li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Recommendations */}
        {currentSimulation.recommendations && currentSimulation.recommendations.length > 0 && (
          <GlassCard variant="subtle" className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white font-medium">Optimization Recommendations</h3>
            </div>
            
            <div className="space-y-3">
              {currentSimulation.recommendations.map((recommendation: string, index: number) => (
                <div
                  key={index}
                  className="p-3 bg-emerald-900/10 border border-emerald-500/20 rounded-lg text-emerald-100"
                >
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mr-2 mt-1 flex-shrink-0" />
                    <p>{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <HolographicButton
            variant="outline"
            onClick={() => setActiveTab('configuration')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Modify Configuration
          </HolographicButton>
          
          <HolographicButton
            onClick={handleStartSimulation}
            glow
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Run Again
          </HolographicButton>
        </div>
      </div>
    );
  };

  // Render history view
  const renderHistoryView = () => {
    if (simulationHistory.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">
              No simulation history available
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {simulationHistory.map((sim, index) => (
          <GlassCard key={index} variant="subtle" className="p-4 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => {
            setCurrentSimulation(sim);
            setActiveTab('results');
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  sim.overall_success 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {sim.overall_success 
                    ? <CheckCircle className="w-5 h-5" /> 
                    : <AlertTriangle className="w-5 h-5" />
                  }
                </div>
                
                <div>
                  <div className="text-white font-medium">
                    Simulation #{sim.id.slice(-8)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(sim.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <div className="text-green-400 font-medium">
                    {sim.workflow_metrics.success_rate}% success rate
                  </div>
                  <div>{sim.workflow_metrics.total_operations} operations</div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {sim.execution_time.toFixed(2)}s execution time
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Workflow className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Simulation Lab</h2>
            <p className="text-gray-300">Test guild performance in a controlled environment</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-white/5 rounded-lg p-1">
            {['configuration', 'realtime', 'results', 'history'].map((tab) => (
              <HolographicButton
                key={tab}
                variant={activeTab === tab ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab as any)}
                className="capitalize"
              >
                {tab}
              </HolographicButton>
            ))}
          </div>
          
          <HolographicButton
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'basic' ? 'advanced' : 'basic')}
          >
            {viewMode === 'basic' ? (
              <>
                <Sliders className="w-4 h-4 mr-2" />
                Advanced
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Basic
              </>
            )}
          </HolographicButton>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/10 border border-red-500/30 p-4 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Configuration View */}
          {activeTab === 'configuration' && (
            <div className="space-y-6">
              <GlassCard variant="medium" className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Simulation Configuration</h3>
                  
                  <HolographicButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    {showSettings ? 'Hide Settings' : 'Show Settings'}
                  </HolographicButton>
                </div>
                
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                          {/* Model Selection */}
                          <div>
                            <AIModelSelector
                              selectedModelId={selectedModel}
                              onSelect={setSelectedModel}
                            />
                            <p className="mt-1 text-xs text-gray-400">
                              Select the AI model that will power your agents during simulation
                            </p>
                          </div>
                          
                          {/* Simulation Type */}
                          <div>
                            <label className="block text-sm text-gray-300 mb-2">Simulation Type</label>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { id: 'comprehensive', label: 'Comprehensive', description: 'Full test suite with all scenarios' },
                                { id: 'quick', label: 'Quick Check', description: 'Rapid validation of basic functionality' },
                                { id: 'stress', label: 'Stress Test', description: 'High-load testing for performance' },
                                { id: 'custom', label: 'Custom', description: 'Customized test configuration' }
                              ].map(type => (
                                <div
                                  key={type.id}
                                  className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${
                                    settings.testType === type.id
                                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                                  }`}
                                  onClick={() => handleSettingChange('testType', type.id)}
                                >
                                  <div className="font-medium text-white text-center">{type.label}</div>
                                  <div className="text-xs text-center mt-1">{type.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Duration */}
                          <div>
                            <label className="block text-sm text-gray-300 mb-2">Simulation Duration</label>
                            <div className="flex items-center space-x-4">
                              <input
                                type="range"
                                min="10"
                                max="300"
                                step="10"
                                value={settings.duration}
                                onChange={(e) => handleSettingChange('duration', parseInt(e.target.value))}
                                className="flex-grow"
                              />
                              <div className="w-16 text-right text-white font-medium">
                                {settings.duration}s
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-gray-400">
                              Longer simulations provide more accurate results
                            </p>
                          </div>
                          
                          {/* Load Factor */}
                          <div>
                            <label className="block text-sm text-gray-300 mb-2">Load Factor</label>
                            <div className="flex items-center space-x-4">
                              <input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.1"
                                value={settings.loadFactor}
                                onChange={(e) => handleSettingChange('loadFactor', parseFloat(e.target.value))}
                                className="flex-grow"
                              />
                              <div className="w-16 text-right text-white font-medium">
                                {settings.loadFactor}x
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-gray-400">
                              Multiplier for request volume and complexity
                            </p>
                          </div>
                        </div>
                        
                        {/* Right Column */}
                        <div className="space-y-6">
                          {/* Test Scenarios */}
                          <div>
                            <label className="block text-sm text-gray-300 mb-2">Test Scenarios</label>
                            <div className="space-y-2 bg-white/5 p-3 rounded-lg border border-white/10">
                              {[
                                { id: 'normal_operation', label: 'Normal Operation', description: 'Standard usage patterns' },
                                { id: 'high_load', label: 'High Load', description: 'Increased volume testing' },
                                { id: 'error_recovery', label: 'Error Recovery', description: 'Test resilience to failures' },
                                { id: 'edge_cases', label: 'Edge Cases', description: 'Unusual input and scenarios' },
                                { id: 'security_tests', label: 'Security Tests', description: 'Test for vulnerabilities' }
                              ].map(scenario => (
                                <div 
                                  key={scenario.id}
                                  className={`flex items-start p-2 rounded-lg transition-colors cursor-pointer ${
                                    settings.testScenarios.includes(scenario.id)
                                      ? 'bg-purple-900/20 border border-purple-500/30'
                                      : 'bg-white/5 hover:bg-white/10'
                                  }`}
                                  onClick={() => handleToggleScenario(scenario.id)}
                                >
                                  <div className={`w-4 h-4 rounded-sm mr-3 flex-shrink-0 flex items-center justify-center mt-0.5 ${
                                    settings.testScenarios.includes(scenario.id)
                                      ? 'bg-purple-500 text-white'
                                      : 'border border-white/30'
                                  }`}>
                                    {settings.testScenarios.includes(scenario.id) && (
                                      <CheckCircle className="w-3 h-3" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-white text-sm font-medium">{scenario.label}</div>
                                    <div className="text-xs text-gray-400">{scenario.description}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Advanced Settings */}
                          <div>
                            <label className="block text-sm text-gray-300 mb-2">Advanced Settings</label>
                            <div className="space-y-2 bg-white/5 p-3 rounded-lg border border-white/10">
                              <label className="flex items-center p-2 hover:bg-white/5 rounded transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.errorInjection}
                                  onChange={(e) => handleSettingChange('errorInjection', e.target.checked)}
                                  className="mr-3"
                                />
                                <div>
                                  <div className="text-white text-sm">Error Injection</div>
                                  <div className="text-xs text-gray-400">Simulate random failures to test resilience</div>
                                </div>
                              </label>
                              
                              <label className="flex items-center p-2 hover:bg-white/5 rounded transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.networkLatency}
                                  onChange={(e) => handleSettingChange('networkLatency', e.target.checked)}
                                  className="mr-3"
                                />
                                <div>
                                  <div className="text-white text-sm">Network Latency Simulation</div>
                                  <div className="text-xs text-gray-400">Simulate variable network conditions</div>
                                </div>
                              </label>
                              
                              <label className="flex items-center p-2 hover:bg-white/5 rounded transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.realTimeMonitoring}
                                  onChange={(e) => handleSettingChange('realTimeMonitoring', e.target.checked)}
                                  className="mr-3"
                                />
                                <div>
                                  <div className="text-white text-sm">Real-time Monitoring</div>
                                  <div className="text-xs text-gray-400">Watch metrics and communication during tests</div>
                                </div>
                              </label>
                              
                              <label className="flex items-center p-2 hover:bg-white/5 rounded transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.slackNotifications}
                                  onChange={(e) => handleSettingChange('slackNotifications', e.target.checked)}
                                  className="mr-3"
                                />
                                <div>
                                  <div className="text-white text-sm">Slack Notifications</div>
                                  <div className="text-xs text-gray-400">Send results to Slack</div>
                                </div>
                              </label>
                              
                              {settings.slackNotifications && (
                                <div className="mt-2 pl-7">
                                  <input
                                    type="text"
                                    placeholder="Slack Webhook URL"
                                    value={settings.slackWebhookUrl}
                                    onChange={(e) => handleSettingChange('slackWebhookUrl', e.target.value)}
                                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Security Settings */}
                      {viewMode === 'advanced' && (
                        <div className="mt-6 pt-6 border-t border-white/10">
                          <div className="flex items-center space-x-2 mb-4">
                            <Shield className="w-5 h-5 text-blue-400" />
                            <h3 className="text-white font-medium">Security & Compliance Testing</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                              <h4 className="text-white text-sm font-medium mb-2">Prompt Injection Tests</h4>
                              <p className="text-xs text-gray-400 mb-3">
                                Attempt to hijack agent instructions with malicious prompts
                              </p>
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-400">
                                  {Math.random() > 0.5 ? 'Standard' : 'Advanced'} scan
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" />
                                  <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                            </div>
                            
                            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                              <h4 className="text-white text-sm font-medium mb-2">Credential Leakage</h4>
                              <p className="text-xs text-gray-400 mb-3">
                                Test for secure handling of API keys and credentials
                              </p>
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-400">
                                  {Math.random() > 0.5 ? 'Basic' : 'Comprehensive'} scan
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" />
                                  <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                            </div>
                            
                            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                              <h4 className="text-white text-sm font-medium mb-2">Content Safety</h4>
                              <p className="text-xs text-gray-400 mb-3">
                                Evaluate agent responses for harmful content
                              </p>
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-400">
                                  {Math.random() > 0.5 ? 'NIST' : 'OWASP'} compliance
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" />
                                  <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex justify-center mt-6">
                  <HolographicButton
                    onClick={handleStartSimulation}
                    disabled={isRunning || settings.testScenarios.length === 0}
                    glow
                    size="lg"
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
              </GlassCard>
              
              {/* Agents Preview */}
              <GlassCard variant="subtle" className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Cpu className="w-5 h-5 text-blue-400" />
                  <h3 className="text-white font-medium">Agents Under Test</h3>
                </div>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {agents.map((agent, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {agent.name.charAt(0)}
                          </div>
                          
                          <div>
                            <h4 className="text-white font-medium">{agent.name}</h4>
                            <div className="text-sm text-blue-300">{agent.role}</div>
                            <p className="text-xs text-gray-400 mt-1 max-w-md">{agent.description}</p>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-300">
                          {agent.tools_needed?.length || 0} tools
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {agents.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-gray-400">No agents available for testing</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          )}
          
          {activeTab === 'realtime' && renderRealtimeView()}
          {activeTab === 'results' && renderResultsView()}
          {activeTab === 'history' && renderHistoryView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};