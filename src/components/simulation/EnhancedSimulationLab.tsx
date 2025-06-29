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
  Database,
  Terminal,
  MessageSquare,
  Code,
  Network,
  RefreshCw,
  Cpu,
  Download,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Settings,
  Sliders,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { AIModelSelector } from '../ui/AIModelSelector';
import { VoiceInterface } from '../voice/VoiceInterface';
import { simulationService, SimulationConfig, SimulationResult } from '../../services/simulationService';
import { AgentCommunicationVisualizer } from '../visualization/AgentCommunicationVisualizer';

interface EnhancedSimulationLabProps {
  guildId: string;
  agents: any[];
  onResults?: (results: SimulationResult) => void;
  advanced?: boolean;
}

export const EnhancedSimulationLab: React.FC<EnhancedSimulationLabProps> = ({
  guildId,
  agents,
  onResults,
  advanced = false
}) => {
  // Simulation state
  const [isRunning, setIsRunning] = useState(false);
  const [currentSimulation, setCurrentSimulation] = useState<SimulationResult | null>(null);
  const [simulationHistory, setSimulationHistory] = useState<SimulationResult[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>({});
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [expandedInsights, setExpandedInsights] = useState<string[]>([]);
  
  // Configuration state
  const [selectedModel, setSelectedModel] = useState('gemini-flash');
  const [simulationConfig, setSimulationConfig] = useState<SimulationConfig>({
    guild_id: guildId,
    agents: agents,
    simulation_type: 'comprehensive',
    parameters: {
      duration_minutes: 5,
      load_factor: 1.0,
      error_injection: true,
      performance_profiling: true,
      ai_model: 'gemini-flash'
    },
    test_scenarios: ['normal_operation', 'high_load', 'error_injection']
  });
  
  // UI state
  const [activeView, setActiveView] = useState<'config' | 'results' | 'communication' | 'analytics'>('config');
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'workflows' | 'errors'>('overview');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(advanced);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  
  // Load simulation history on mount
  useEffect(() => {
    loadSimulationHistory();
  }, [guildId]);
  
  // Update model in config when selected model changes
  useEffect(() => {
    if (selectedModel) {
      setSimulationConfig(prev => ({
        ...prev,
        parameters: {
          ...prev.parameters,
          ai_model: selectedModel
        }
      }));
    }
  }, [selectedModel]);
  
  // Load simulation history
  const loadSimulationHistory = async () => {
    try {
      const history = await simulationService.getSimulationHistory(guildId);
      setSimulationHistory(history);
    } catch (error) {
      console.error('Failed to load simulation history:', error);
    }
  };
  
  // Start simulation
  const startSimulation = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setProgress(0);
    setCurrentSimulation(null);
    setActiveView('results');
    
    // Start progress animation
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 5 + 1; // 1-6% increment
        const newProgress = Math.min(prev + increment, 99);
        return newProgress;
      });
    }, 1000);
    
    try {
      // Run the simulation
      console.log('🧪 Running simulation with config:', simulationConfig);
      const results = await simulationService.runSimulation(guildId, simulationConfig);
      
      // Stop progress animation and set to 100%
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setProgress(100);
      setCurrentSimulation(results);
      setIsRunning(false);
      
      // Add to history
      setSimulationHistory(prev => [results, ...prev.slice(0, 4)]);
      
      // Call onResults callback if provided
      if (onResults) {
        onResults(results);
      }
    } catch (error) {
      console.error('Simulation failed:', error);
      
      // Stop progress animation
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setIsRunning(false);
      
      // Create a failed simulation result
      const failedSimulation: SimulationResult = {
        id: `sim-${Date.now()}`,
        guild_id: guildId,
        overall_success: false,
        execution_time: 0,
        agent_responses: [],
        insights: [
          'Simulation failed to complete.',
          'Please check your configuration and try again.'
        ],
        workflow_metrics: {
          average_response_time_ms: 0,
          success_rate: 0,
          total_operations: 0,
          peak_concurrent_operations: 0
        },
        recommendations: [
          'Check your network connection.',
          'Verify that all services are running.',
          'Try reducing the simulation complexity.'
        ],
        created_at: new Date().toISOString()
      };
      
      setCurrentSimulation(failedSimulation);
    }
  };
  
  // Stop simulation
  const stopSimulation = () => {
    if (!isRunning) return;
    
    // Stop progress animation
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setIsRunning(false);
    
    // Create a cancelled simulation result
    const cancelledSimulation: SimulationResult = {
      id: `sim-${Date.now()}`,
      guild_id: guildId,
      overall_success: false,
      execution_time: 0,
      agent_responses: [],
      insights: ['Simulation was cancelled by the user.'],
      workflow_metrics: {
        average_response_time_ms: 0,
        success_rate: 0,
        total_operations: 0,
        peak_concurrent_operations: 0
      },
      recommendations: ['Resume the simulation to get complete results.'],
      created_at: new Date().toISOString()
    };
    
    setCurrentSimulation(cancelledSimulation);
  };
  
  // Toggle expanded insight
  const toggleInsight = (id: string) => {
    if (expandedInsights.includes(id)) {
      setExpandedInsights(expandedInsights.filter(insightId => insightId !== id));
    } else {
      setExpandedInsights([...expandedInsights, id]);
    }
  };
  
  // Export simulation results
  const exportResults = () => {
    if (!currentSimulation) return;
    
    const dataStr = JSON.stringify(currentSimulation, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `simulation-${currentSimulation.id.slice(0, 8)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Update configuration
  const updateConfig = (key: string, value: any) => {
    if (key.includes('.')) {
      // Handle nested keys like 'parameters.duration_minutes'
      const [parent, child] = key.split('.');
      setSimulationConfig(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSimulationConfig(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };
  
  // Update test scenario selection
  const toggleScenario = (scenario: string) => {
    setSimulationConfig(prev => {
      const currentScenarios = prev.test_scenarios || [];
      
      if (currentScenarios.includes(scenario)) {
        return {
          ...prev,
          test_scenarios: currentScenarios.filter(s => s !== scenario)
        };
      } else {
        return {
          ...prev,
          test_scenarios: [...currentScenarios, scenario]
        };
      }
    });
  };
  
  return (
    <ReactFlowProvider>
      <div className="h-full flex flex-col">
        {/* Header with Title and Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Advanced Simulation Lab</h2>
              <p className="text-gray-300 text-sm">
                Test your AI guild with realistic scenarios and production conditions
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <HolographicButton
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
            >
              <Settings className="w-4 h-4 mr-2" />
              {showAdvancedConfig ? 'Simple Mode' : 'Advanced Mode'}
            </HolographicButton>
            
            {isMinimized ? (
              <HolographicButton
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(false)}
              >
                <Maximize2 className="w-4 h-4" />
              </HolographicButton>
            ) : (
              <HolographicButton
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="w-4 h-4" />
              </HolographicButton>
            )}
          </div>
        </div>
        
        {!isMinimized && (
          <>
            {/* Tabs Navigation */}
            <div className="mb-4 border-b border-white/10">
              <div className="flex space-x-1">
                <HolographicButton
                  variant={activeView === 'config' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('config')}
                >
                  <Sliders className="w-4 h-4 mr-2" />
                  Configure
                </HolographicButton>
                
                <HolographicButton
                  variant={activeView === 'results' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('results')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Results
                </HolographicButton>
                
                <HolographicButton
                  variant={activeView === 'communication' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('communication')}
                >
                  <Network className="w-4 h-4 mr-2" />
                  Communication
                </HolographicButton>
                
                <HolographicButton
                  variant={activeView === 'analytics' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('analytics')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </HolographicButton>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Configuration View */}
                  {activeView === 'config' && (
                    <GlassCard variant="medium" className="p-6">
                      <div className="space-y-6">
                        {/* Basic Configuration */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Cpu className="w-5 h-5 text-purple-400 mr-2" />
                            Simulation Configuration
                          </h3>
                          
                          {/* AI Model Selection */}
                          <div className="mb-4">
                            <AIModelSelector
                              selectedModelId={selectedModel}
                              onSelect={setSelectedModel}
                              label="AI Intelligence Model"
                            />
                          </div>
                          
                          {/* Simulation Type */}
                          <div>
                            <label className="block text-sm text-gray-300 mb-2">Simulation Type</label>
                            <select
                              value={simulationConfig.simulation_type}
                              onChange={(e) => updateConfig('simulation_type', e.target.value)}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                            >
                              <option value="comprehensive">Comprehensive Test (Full Testing Suite)</option>
                              <option value="quick">Quick Validation (Basic Functionality)</option>
                              <option value="stress">Stress Test (High Load Conditions)</option>
                              <option value="custom">Custom Scenarios (Advanced)</option>
                            </select>
                            
                            <div className="mt-2 text-xs text-gray-400">
                              {simulationConfig.simulation_type === 'comprehensive' && 'Tests all aspects of your guild with realistic scenarios and user interactions.'}
                              {simulationConfig.simulation_type === 'quick' && 'Performs a quick check of basic functionality to ensure everything is working.'}
                              {simulationConfig.simulation_type === 'stress' && 'Simulates high load conditions to test system stability and performance.'}
                              {simulationConfig.simulation_type === 'custom' && 'Define your own test scenarios and parameters for advanced testing.'}
                            </div>
                          </div>
                          
                          {/* Duration and Load Factor */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-300 mb-2">
                                Duration (minutes)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="60"
                                value={simulationConfig.parameters.duration_minutes}
                                onChange={(e) => updateConfig('parameters.duration_minutes', parseInt(e.target.value))}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm text-gray-300 mb-2">
                                Load Factor ({simulationConfig.parameters.load_factor}x)
                              </label>
                              <input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.1"
                                value={simulationConfig.parameters.load_factor}
                                onChange={(e) => updateConfig('parameters.load_factor', parseFloat(e.target.value))}
                                className="w-full"
                              />
                            </div>
                          </div>
                          
                          {/* Test Scenarios */}
                          <div>
                            <label className="block text-sm text-gray-300 mb-2">Test Scenarios</label>
                            <div className="grid grid-cols-2 gap-3">
                              <div 
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                  simulationConfig.test_scenarios.includes('normal_operation')
                                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                                }`}
                                onClick={() => toggleScenario('normal_operation')}
                              >
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Normal Operation</span>
                                </div>
                                <div className="mt-1 text-xs opacity-70">
                                  Standard user interactions
                                </div>
                              </div>
                              
                              <div 
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                  simulationConfig.test_scenarios.includes('high_load')
                                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                                }`}
                                onClick={() => toggleScenario('high_load')}
                              >
                                <div className="flex items-center space-x-2">
                                  <Activity className="w-4 h-4" />
                                  <span>High Load</span>
                                </div>
                                <div className="mt-1 text-xs opacity-70">
                                  Concurrent user requests
                                </div>
                              </div>
                              
                              <div 
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                  simulationConfig.test_scenarios.includes('error_injection')
                                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                                }`}
                                onClick={() => toggleScenario('error_injection')}
                              >
                                <div className="flex items-center space-x-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span>Error Injection</span>
                                </div>
                                <div className="mt-1 text-xs opacity-70">
                                  Simulated failures
                                </div>
                              </div>
                              
                              <div 
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                  simulationConfig.test_scenarios.includes('complex_queries')
                                    ? 'bg-green-500/20 border-green-500/40 text-green-300'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                                }`}
                                onClick={() => toggleScenario('complex_queries')}
                              >
                                <div className="flex items-center space-x-2">
                                  <Code className="w-4 h-4" />
                                  <span>Complex Queries</span>
                                </div>
                                <div className="mt-1 text-xs opacity-70">
                                  Multi-step reasoning
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Advanced Options */}
                          {showAdvancedConfig && (
                            <div className="mt-6 pt-6 border-t border-white/10">
                              <h4 className="text-white font-semibold mb-4">Advanced Options</h4>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="errorInjection"
                                    checked={simulationConfig.parameters.error_injection}
                                    onChange={(e) => updateConfig('parameters.error_injection', e.target.checked)}
                                    className="rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                                  />
                                  <label htmlFor="errorInjection" className="text-sm text-gray-300">
                                    Error Injection Testing
                                  </label>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="performanceProfiler"
                                    checked={simulationConfig.parameters.performance_profiling}
                                    onChange={(e) => updateConfig('parameters.performance_profiling', e.target.checked)}
                                    className="rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                                  />
                                  <label htmlFor="performanceProfiler" className="text-sm text-gray-300">
                                    Performance Profiling
                                  </label>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="voiceEnabled"
                                    checked={isVoiceEnabled}
                                    onChange={(e) => setIsVoiceEnabled(e.target.checked)}
                                    className="rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                                  />
                                  <label htmlFor="voiceEnabled" className="text-sm text-gray-300">
                                    Voice Interface Testing
                                  </label>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="networkLatency"
                                    checked={simulationConfig.parameters.network_latency}
                                    onChange={(e) => updateConfig('parameters.network_latency', e.target.checked)}
                                    className="rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                                  />
                                  <label htmlFor="networkLatency" className="text-sm text-gray-300">
                                    Network Latency Simulation
                                  </label>
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <label className="block text-sm text-gray-300 mb-2">
                                  Integration Tests
                                </label>
                                <select
                                  value={simulationConfig.parameters.integration_tests || 'minimal'}
                                  onChange={(e) => updateConfig('parameters.integration_tests', e.target.value)}
                                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                                >
                                  <option value="minimal">Minimal (API Connectivity Only)</option>
                                  <option value="standard">Standard (Core Integrations)</option>
                                  <option value="comprehensive">Comprehensive (Full Integration Suite)</option>
                                </select>
                              </div>
                              
                              <div className="mt-4">
                                <label className="block text-sm text-gray-300 mb-2">
                                  Memory Testing
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      name="memoryTesting"
                                      value="short_term"
                                      checked={simulationConfig.parameters.memory_testing === 'short_term' || !simulationConfig.parameters.memory_testing}
                                      onChange={() => updateConfig('parameters.memory_testing', 'short_term')}
                                      className="text-purple-500 focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-300">Short-term (Conversation)</span>
                                  </label>
                                  
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      name="memoryTesting"
                                      value="long_term"
                                      checked={simulationConfig.parameters.memory_testing === 'long_term'}
                                      onChange={() => updateConfig('parameters.memory_testing', 'long_term')}
                                      className="text-purple-500 focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-300">Long-term (Semantic)</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Submit Button */}
                          <div className="mt-6">
                            <HolographicButton
                              onClick={startSimulation}
                              disabled={isRunning}
                              size="lg"
                              className="w-full"
                              glow
                            >
                              {isRunning ? (
                                <>
                                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                  Simulation Running...
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
                      </div>
                    </GlassCard>
                  )}
                  
                  {/* Results View */}
                  {activeView === 'results' && (
                    <div className="space-y-6">
                      {/* Progress indicator during simulation */}
                      {isRunning && (
                        <GlassCard variant="medium" className="p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">
                            Simulation in Progress
                          </h3>
                          
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-300">Progress</span>
                              <span className="text-sm text-gray-300">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-xs text-gray-400">Agents Tested</div>
                              <div className="text-lg text-white font-semibold">
                                {Math.floor(agents.length * (progress / 100))} / {agents.length}
                              </div>
                            </div>
                            
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-xs text-gray-400">Scenarios</div>
                              <div className="text-lg text-white font-semibold">
                                {Math.floor(simulationConfig.test_scenarios.length * (progress / 100))} / {simulationConfig.test_scenarios.length}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <HolographicButton
                              onClick={stopSimulation}
                              variant="outline"
                              className="px-8"
                            >
                              <Square className="w-4 h-4 mr-2" />
                              Cancel Simulation
                            </HolographicButton>
                          </div>
                        </GlassCard>
                      )}
                      
                      {/* Simulation Results */}
                      {!isRunning && currentSimulation && (
                        <GlassCard variant="medium" className="p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                currentSimulation.overall_success 
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {currentSimulation.overall_success 
                                  ? <CheckCircle className="w-6 h-6" />
                                  : <AlertTriangle className="w-6 h-6" />
                                }
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-white">
                                  Simulation {currentSimulation.overall_success ? 'Succeeded' : 'Failed'}
                                </h3>
                                <div className="text-sm text-gray-300">
                                  ID: {currentSimulation.id.slice(0, 8)} • Execution Time: {currentSimulation.execution_time.toFixed(2)}s
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <HolographicButton
                                onClick={exportResults}
                                variant="ghost"
                                size="sm"
                              >
                                <Download className="w-4 h-4" />
                              </HolographicButton>
                              
                              <HolographicButton
                                onClick={startSimulation}
                                variant="ghost"
                                size="sm"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </HolographicButton>
                            </div>
                          </div>
                          
                          <div className="mb-6 border-b border-white/10 pb-1">
                            <div className="flex space-x-2">
                              <HolographicButton
                                variant={activeTab === 'overview' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveTab('overview')}
                              >
                                <Activity className="w-4 h-4 mr-2" />
                                Overview
                              </HolographicButton>
                              
                              <HolographicButton
                                variant={activeTab === 'agents' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveTab('agents')}
                              >
                                <Cpu className="w-4 h-4 mr-2" />
                                Agents
                              </HolographicButton>
                              
                              <HolographicButton
                                variant={activeTab === 'workflows' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveTab('workflows')}
                              >
                                <Zap className="w-4 h-4 mr-2" />
                                Workflows
                              </HolographicButton>
                              
                              <HolographicButton
                                variant={activeTab === 'errors' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveTab('errors')}
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Errors
                              </HolographicButton>
                            </div>
                          </div>
                          
                          {/* Overview Tab */}
                          {activeTab === 'overview' && (
                            <div>
                              <div className="grid md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Clock className="w-4 h-4 text-blue-400" />
                                    <div className="text-sm text-gray-300">Response Time</div>
                                  </div>
                                  <div className="text-xl font-semibold text-white">
                                    {currentSimulation.workflow_metrics?.average_response_time_ms || 0} ms
                                  </div>
                                </div>
                                
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <div className="text-sm text-gray-300">Success Rate</div>
                                  </div>
                                  <div className="text-xl font-semibold text-white">
                                    {currentSimulation.workflow_metrics?.success_rate || 0}%
                                  </div>
                                </div>
                                
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Activity className="w-4 h-4 text-purple-400" />
                                    <div className="text-sm text-gray-300">Operations</div>
                                  </div>
                                  <div className="text-xl font-semibold text-white">
                                    {currentSimulation.workflow_metrics?.total_operations || 0}
                                  </div>
                                </div>
                                
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Zap className="w-4 h-4 text-yellow-400" />
                                    <div className="text-sm text-gray-300">Peak Load</div>
                                  </div>
                                  <div className="text-xl font-semibold text-white">
                                    {currentSimulation.workflow_metrics?.peak_concurrent_operations || 0}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Insights */}
                              <div className="mb-6">
                                <h4 className="text-lg font-semibold text-white mb-3">
                                  AI Insights
                                </h4>
                                <div className="space-y-3">
                                  {currentSimulation.insights.map((insight, index) => (
                                    <div
                                      key={index}
                                      className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20"
                                    >
                                      <div className="flex items-start">
                                        <div className="mr-3 mt-0.5">
                                          <Brain className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div className="text-blue-200">
                                          {insight}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Recommendations */}
                              <div>
                                <h4 className="text-lg font-semibold text-white mb-3">
                                  Recommendations
                                </h4>
                                <div className="space-y-2">
                                  {currentSimulation.recommendations.map((rec, index) => (
                                    <div
                                      key={index}
                                      className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20"
                                    >
                                      <div className="flex items-center text-purple-200">
                                        <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center mr-3 flex-shrink-0">
                                          <span className="text-xs text-white">{index + 1}</span>
                                        </div>
                                        {rec}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Agents Tab */}
                          {activeTab === 'agents' && (
                            <div>
                              <div className="space-y-4">
                                {currentSimulation.agent_responses.map((agent, index) => (
                                  <GlassCard
                                    key={index}
                                    variant="subtle"
                                    className="p-4"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                                          agent.success 
                                            ? 'bg-green-500/20 text-green-400' 
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                          <Cpu className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <h4 className="text-white font-medium">{agent.agent_name}</h4>
                                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                                            <span>Execution Time: {agent.execution_time.toFixed(2)}s</span>
                                            <span className={agent.success ? 'text-green-400' : 'text-red-400'}>
                                              {agent.success ? 'Succeeded' : 'Failed'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <HolographicButton
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleInsight(`agent-${index}`)}
                                      >
                                        {expandedInsights.includes(`agent-${index}`) 
                                          ? <ChevronDown className="w-4 h-4" /> 
                                          : <ChevronRight className="w-4 h-4" />
                                        }
                                      </HolographicButton>
                                    </div>
                                    
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/10 mb-3">
                                      <div className="text-gray-300 text-sm">
                                        {agent.response}
                                      </div>
                                    </div>
                                    
                                    {expandedInsights.includes(`agent-${index}`) && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="p-3 bg-black/20 rounded-lg">
                                          <h5 className="text-sm font-medium text-gray-300 mb-2">Thought Process:</h5>
                                          <div className="space-y-1">
                                            {agent.thought_process.map((thought, i) => (
                                              <div key={i} className="flex items-center text-xs">
                                                <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center mr-2 flex-shrink-0">
                                                  <span className="text-[10px] text-white">{i + 1}</span>
                                                </div>
                                                <div className="text-gray-300">{thought}</div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </GlassCard>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Workflows Tab */}
                          {activeTab === 'workflows' && (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                                <Zap className="w-8 h-8 text-yellow-400" />
                              </div>
                              <h3 className="text-lg font-semibold text-white mb-2">
                                Workflow Performance
                              </h3>
                              <p className="text-gray-300 max-w-md mx-auto">
                                Advanced workflow analytics will be available in a future update.
                                Currently, you can view basic metrics in the Overview tab.
                              </p>
                            </div>
                          )}
                          
                          {/* Errors Tab */}
                          {activeTab === 'errors' && (
                            <div>
                              {currentSimulation.overall_success ? (
                                <div className="text-center py-12">
                                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-400" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-white mb-2">
                                    No Errors Detected
                                  </h3>
                                  <p className="text-gray-300 max-w-md mx-auto">
                                    All simulation tests passed successfully. Your guild is performing as expected.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                                    <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                                      <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                                      Simulation Failed
                                    </h4>
                                    <p className="text-red-300">
                                      {currentSimulation.agent_responses.some(a => !a.success)
                                        ? `${currentSimulation.agent_responses.filter(a => !a.success).length} agent(s) failed to perform as expected.`
                                        : 'The simulation encountered errors during execution.'
                                      }
                                    </p>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    {currentSimulation.agent_responses
                                      .filter(a => !a.success)
                                      .map((agent, index) => (
                                        <div 
                                          key={index}
                                          className="p-4 bg-red-500/10 rounded-lg border border-red-500/20"
                                        >
                                          <div className="flex items-start space-x-3">
                                            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                              <h5 className="text-white font-medium mb-1">
                                                {agent.agent_name} Failed
                                              </h5>
                                              <p className="text-gray-300 text-sm mb-2">
                                                {agent.response}
                                              </p>
                                              <div className="text-xs text-gray-400">
                                                Execution Time: {agent.execution_time.toFixed(2)}s
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </GlassCard>
                      )}
                      
                      {/* No Results State */}
                      {!isRunning && !currentSimulation && (
                        <GlassCard variant="medium" className="p-6">
                          <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                              <Play className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                              No Simulation Results
                            </h3>
                            <p className="text-gray-300 max-w-md mx-auto mb-6">
                              Configure and run a simulation to test your guild with realistic scenarios.
                            </p>
                            <HolographicButton
                              onClick={() => setActiveView('config')}
                              variant="outline"
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Configure Simulation
                            </HolographicButton>
                          </div>
                        </GlassCard>
                      )}
                      
                      {/* Simulation History */}
                      {simulationHistory.length > 0 && (
                        <GlassCard variant="subtle" className="p-4">
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Simulation History
                          </h3>
                          
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {simulationHistory.map((sim, index) => (
                              <div
                                key={index}
                                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                                  currentSimulation && currentSimulation.id === sim.id
                                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-200'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                                }`}
                                onClick={() => setCurrentSimulation(sim)}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    {sim.overall_success
                                      ? <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                                      : <AlertTriangle className="w-4 h-4 text-red-400 mr-2" />
                                    }
                                    <span>Simulation {sim.id.slice(0, 8)}</span>
                                  </div>
                                  
                                  <div className="text-xs text-gray-400">
                                    {new Date(sim.created_at).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </GlassCard>
                      )}
                    </div>
                  )}
                  
                  {/* Communication View */}
                  {activeView === 'communication' && (
                    <div className="h-full">
                      <AgentCommunicationVisualizer
                        agents={agents.map(agent => ({
                          id: agent.name.toLowerCase().replace(/\s+/g, '-'),
                          name: agent.name,
                          role: agent.role,
                          description: agent.description || '',
                          status: 'active'
                        }))}
                        onAgentClick={(agentId) => setSelectedAgent(agentId)}
                      />
                    </div>
                  )}
                  
                  {/* Analytics View */}
                  {activeView === 'analytics' && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                        <BarChart3 className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Advanced Analytics
                      </h3>
                      <p className="text-gray-300 max-w-md mx-auto">
                        Detailed analytics will be available after running multiple simulations to establish performance baselines.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
      
      {/* Voice Interface */}
      <VoiceInterface
        agentId={selectedAgent || undefined}
        agentName={selectedAgent ? `${agents.find(a => a.name.toLowerCase().replace(/\s+/g, '-') === selectedAgent)?.name || 'Test Agent'}` : 'Simulation Assistant'}
        isVisible={isVoiceEnabled}
      />
    </ReactFlowProvider>
  );
};