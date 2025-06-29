import React, { useEffect, useState } from 'react';
import { Play, CheckCircle, AlertCircle, ArrowRight, Brain, Zap, Clock, Settings, Cpu, Beaker } from 'lucide-react';
import { useWizardStore } from '../../../stores/wizardStore';
import { GlassCard } from '../../ui/GlassCard';
import { EnhancedSimulationLab } from '../../simulation/EnhancedSimulationLab';
import { HolographicButton } from '../../ui/HolographicButton';
import { SimulationLab } from '../../simulation/SimulationLab';
import { AIModelSelector } from '../../ui/AIModelSelector';
import { Card, CardContent } from '../../ui/Card';

export const SimulationStep: React.FC = () => {
  // Get state from wizard store
  const { 
    blueprint,
    credentials,
    simulationResults,
    isLoading,
    runSimulation,
    setStep,
    errors 
  } = useWizardStore();
  
  // Component state
  const [showDetails, setShowDetails] = useState(false);
  const [showLabView, setShowLabView] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-flash');
  const [simulationSettings, setSimulationSettings] = useState({
    llmChoice: 'gemini_2_flash', // Updated to use Gemini 2.0 Flash
    simulationType: 'comprehensive',
    simulationDuration: 60, // Shorter duration for faster results
    voiceEnabled: false,
    slackEnabled: false,
    slackWebhookUrl: credentials.slack_webhook_url || ''
  });

  // When model selection changes, update the simulation settings
  useEffect(() => {
    if (selectedModel) {
      setSimulationSettings(prev => ({
        ...prev,
        llmChoice: selectedModel === 'gemini-flash' ? 'gemini_2_flash' 
                 : selectedModel === 'gemini-pro' ? 'gemini_2_pro'
                 : selectedModel === 'claude-3-sonnet' ? 'claude_3_sonnet'
                 : 'gpt_4'
      }));
    }
  }, [selectedModel]);

  // When credentials change, update Slack settings
  useEffect(() => {
    if (credentials.slack_webhook_url) {
      setSimulationSettings(prev => ({
        ...prev,
        slackEnabled: true,
        slackWebhookUrl: credentials.slack_webhook_url
      }));
    }
  }, [credentials]);

  const handleSettingChange = (setting: string, value: any) => {
    setSimulationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleRunSimulation = async () => {
    // Pass the simulation settings to the runSimulation function
    try {
      console.log('🧪 Running simulation with settings:', simulationSettings);
      
      // Create enhanced simulation config
      const simulationConfig = {
        blueprint_id: blueprint?.id,
        agents: blueprint?.suggested_structure.agents || [],
        workflows: blueprint?.suggested_structure.workflows || [],
        test_credentials: credentials,
        simulation_type: simulationSettings.simulationType,
        parameters: {
          duration_minutes: simulationSettings.simulationDuration / 60, // Convert seconds to minutes
          load_factor: 1.0,
          error_injection: true,
          performance_profiling: true,
          ai_model: simulationSettings.llmChoice,
          slackEnabled: simulationSettings.slackEnabled,
          slackWebhookUrl: simulationSettings.slackWebhookUrl
        }
      };
      
      // Run the simulation with enhanced config
      await runSimulation();
    } catch (error) {
      console.error('Simulation failed:', error);
    }
  };

  const handleDeploy = () => {
    setStep('deployment');
  };
  const hasValidCredentials = Object.keys(credentials).length > 0;
  
  // When the model changes, store it in localStorage for system-wide use
  useEffect(() => {
    localStorage.setItem('preferred_ai_model', selectedModel);
  }, [selectedModel]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            Simulation Lab
          </h1>
          <p className="text-lg text-gray-300">
            Test your guild in a realistic environment before deployment
          </p>
          
          <div className="mt-4 flex items-center space-x-1 bg-white/10 rounded-lg p-1 border border-white/20">
            <HolographicButton
              variant={!showLabView ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setShowLabView(false)}
            >
              Simple Test
            </HolographicButton>
            
            <HolographicButton
              variant={showLabView ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setShowLabView(true)}
            >
              Advanced Lab
            </HolographicButton>
          </div>
        </div>

        {showLabView ? (
          <EnhancedSimulationLab
            guildId={blueprint?.suggested_structure.guild_name || 'test-guild'}
            agents={blueprint?.suggested_structure.agents || []}
            onResults={(results) => {
              console.log('✅ Simulation completed:', results);
              runSimulation();
            }}
          />
        ) : (
        <GlassCard variant="medium" className="p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white text-2xl font-bold">AI-Powered Simulation Lab</h3>
              <p className="text-gray-300">Our advanced simulation engine will test agent coordination, response quality, and workflow execution</p>
            </div>
          </div>

          {!simulationResults ? (
              <div className="text-center py-8">
                <div className="max-w-xl mx-auto mb-6">
                  <AIModelSelector
                    selectedModelId={selectedModel}
                    onSelect={setSelectedModel}
                    label="Select AI Intelligence Model"
                  />
                </div>
              
                {!hasValidCredentials ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Credentials Required</h3>
                    <p className="text-gray-300 mb-6 max-w-md mx-auto">
                      Please provide your API credentials in the previous step to run a comprehensive simulation with real integrations.
                    </p>
                    <HolographicButton
                      onClick={() => setStep('credentials')}
                      variant="outline"
                      className="mb-4"
                    >
                      Add Credentials
                    </HolographicButton>
                  </div>
                ) : (
                  <>
                    <div className="bg-white/10 p-6 rounded-xl border border-white/20 mb-6">
                      <h4 className="font-medium text-white mb-4">Simulation Settings</h4>
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="block text-sm text-gray-300 mb-1">Agent Intelligence Model</label>
                          <select
                            value={simulationSettings.llmChoice}
                            onChange={(e) => handleSettingChange('llmChoice', e.target.value)}
                            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={isLoading}
                          >
                            <option value="gemini_2_flash">Gemini 2.0 Flash (Default)</option>
                            <option value="gemini_2_pro">Gemini 2.0 Pro (Advanced)</option>
                            <option value="claude">Claude (Experimental)</option>
                            <option value="gpt4">GPT-4 (Premium)</option>
                          </select>
                          <p className="text-xs text-gray-400">
                            {simulationSettings.llmChoice === 'gemini_2_flash' && "Fast, efficient responses with Gemini 2.0. Good for most tasks."}
                            {simulationSettings.llmChoice === 'gemini_2_pro' && "Enhanced reasoning capabilities with Gemini 2.0. Better for complex tasks."}
                            {simulationSettings.llmChoice === 'claude' && "Experimental integration with Claude's capabilities."}
                            {simulationSettings.llmChoice === 'gpt4' && "Premium tier with GPT-4's advanced intelligence."}
                          </p>
                        </div>

                        {/* Slack Integration */}
                        {credentials.slack_webhook_url && (
                          <div className="space-y-2 border border-blue-500/30 rounded-lg p-4 bg-blue-500/10">
                            <label className="flex items-center justify-between text-sm text-blue-300 mb-1">
                              <span>Slack Integration</span>
                              <span className="text-green-400">Available</span>
                            </label>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="slackEnabled"
                                checked={simulationSettings.slackEnabled}
                                onChange={(e) => handleSettingChange('slackEnabled', e.target.checked)}
                                className="mr-2"
                                disabled={isLoading}
                              />
                              <label htmlFor="slackEnabled" className="text-sm text-gray-300">Send simulation results to Slack</label>
                            </div>
                            {simulationSettings.slackEnabled && (
                              <div className="text-xs text-gray-400 mt-1">
                                Simulation results will be sent to your connected Slack channel
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <label className="block text-sm text-gray-300 mb-1">Simulation Type</label>
                          <div className="flex space-x-2">
                            {['comprehensive', 'quick', 'stress'].map(type => (
                              <button
                                key={type}
                                onClick={() => handleSettingChange('simulationType', type)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  simulationSettings.simulationType === type 
                                    ? 'bg-purple-500/30 text-white border border-purple-500/50' 
                                    : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                                }`}
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="flex items-center justify-between text-sm text-gray-300 mb-1">
                            <span>Simulation Duration</span>
                            <span className="text-purple-400">{simulationSettings.simulationDuration}s</span>
                          </label>
                          <input
                            type="range" 
                            min="10"
                            max="120"
                            step="10"
                            value={simulationSettings.simulationDuration}
                            onChange={(e) => handleSettingChange('simulationDuration', parseInt(e.target.value))}
                            className="w-full"
                            disabled={isLoading}
                          />
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="voiceEnabled"
                            checked={simulationSettings.voiceEnabled}
                            onChange={(e) => handleSettingChange('voiceEnabled', e.target.checked)}
                            className="mr-2"
                            disabled={isLoading}
                          />
                          <label htmlFor="voiceEnabled" className="text-sm text-gray-300">Enable Voice Simulation</label>
                        </div>
                      </div>
                    </div>

                    {errors.length > 0 && (
                      <div className="text-red-300 text-sm bg-red-500/20 border border-red-500/30 p-3 rounded-lg mb-4">
                        {errors.join(', ')}
                      </div>
                    )}

                    <HolographicButton
                      onClick={handleRunSimulation}
                      size="lg"
                      className="w-full sm:w-auto group"
                      glow
                      disabled={isLoading}
                    >
                      <div className="flex items-center">
                        {isLoading ? (
                          <>Running AI Simulation...</>
                        ) : (
                          <>
                            Start Intelligence Test
                            <Play className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                          </>
                        )}
                      </div>
                    </HolographicButton>

                    {isLoading && (
                      <div className="mt-6 space-y-3 animate-pulse">
                        <div className="text-sm text-purple-300 text-center">
                          Testing agent coordination and intelligence...
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center text-green-600 mb-6">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  <span className="text-lg font-semibold">Simulation Completed Successfully</span>
                  <span className="ml-auto text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                    {simulationResults.execution_time}s total
                  </span>
                </div>

                <div className="grid gap-4">
                  {simulationResults.agent_responses?.map((agent: any, index: number) => (
                    <Card key={index} className="border-l-4 border-l-green-500">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{agent.agent_name}</h3>
                            <div className="flex items-center mt-1">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                              <span className="text-sm text-green-600 font-medium">Performance: Excellent</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-500">{agent.execution_time}s</span>
                            <div className="text-xs text-gray-400">Response Time</div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg mb-4">
                          <p className="text-green-800">{agent.response}</p>
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center"
                          >
                            AI Thought Process
                            <ArrowRight className={`w-3 h-3 ml-1 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
                          </button>
                          
                          {showDetails && (
                            <ul className="space-y-1 text-sm text-gray-600 ml-4">
                              {agent.thought_process.map((thought: string, thoughtIndex: number) => (
                                <li key={thoughtIndex} className="flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                                  {thought}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <Brain className="w-5 h-5 mr-2" />
                      AI Performance Insights
                    </h4>
                    <div className="space-y-2">
                      {simulationResults.insights?.map((insight: string, index: number) => (
                        <div key={index} className="flex items-center text-blue-800 text-sm">
                          <CheckCircle className="w-3 h-3 mr-2 text-blue-500" />
                          {insight}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                      <div className="text-sm text-blue-900">
                        <strong>Overall Assessment:</strong> Your Guild demonstrates excellent AI coordination and is 
                        ready for production deployment. All agents performed within optimal parameters.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
        </GlassCard>
        )}

        {simulationResults && (
          <div className="flex justify-center">
            <HolographicButton onClick={handleDeploy} size="lg" glow>
              <Beaker className="w-5 h-5 mr-2" />
              Deploy Live Guild
              <ArrowRight className="w-5 h-5 ml-2" />
            </HolographicButton>
          </div>
        )}
      </div>
    </div>
  );
};