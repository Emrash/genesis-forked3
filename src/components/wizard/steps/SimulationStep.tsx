import React, { useEffect, useState } from 'react';
import { Play, CheckCircle, AlertCircle, ArrowRight, Brain, Zap, Clock, Settings, Cpu, Beaker } from 'lucide-react';
import { useWizardStore } from '../../../stores/wizardStore';
import { GlassCard } from '../../ui/GlassCard';
import { EnhancedSimulationLab } from '../../simulation/EnhancedSimulationLab';
import { HolographicButton } from '../../ui/HolographicButton';
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
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Simulation Lab
          </h1>
          <p className="text-lg text-gray-600">
            Test your guild in a realistic environment before deployment
          </p>
        </div>

        <GlassCard variant="medium" className="p-6 mb-6">
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
                variant={showLabView ? "outline" : "primary"}
                size="sm"
                onClick={() => setShowLabView(!showLabView)}
              >
                {showLabView ? "Simple View" : "Advanced Lab"}
              </HolographicButton>
            </div>
          </div>

          {showLabView ? (
            <EnhancedSimulationLab
              guildId={blueprint?.suggested_structure.guild_name || 'test-guild'}
              agents={blueprint?.suggested_structure.agents || []}
              onResults={(results) => {
                console.log('✅ Simulation completed successfully:', results?.id);
                runSimulation();
                // Store results in local storage as a backup
                try {
                  localStorage.setItem('last_simulation_results', JSON.stringify(results));
                } catch (error) {
                  console.warn('Failed to save simulation results to localStorage:', error);
                }
              }}
            />
          ) : (
            <div className="space-y-6">
              {/* Simple Simulation UI */}
              <div className="max-w-xl mx-auto">
                <AIModelSelector
                  selectedModelId={selectedModel}
                  onSelect={setSelectedModel}
                  label="Select AI Intelligence Model"
                  className="mb-6"
                />

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
                      <div className="text-xs text-gray-300">Workflows</div>
                      <div className="text-lg font-medium text-white">
                        {blueprint?.suggested_structure.workflows.length || 0}
                      </div>
                    </div>
                    <div className="bg-white/10 p-2 rounded">
                      <div className="text-xs text-gray-300">Est. Time</div>
                      <div className="text-lg font-medium text-white">~60s</div>
                    </div>
                  </div>
                </div>

                {errors.length > 0 && (
                  <div className="bg-red-500/20 border border-red-500/30 p-3 rounded-lg text-red-300 mb-6">
                    {errors.join(', ')}
                  </div>
                )}

                <div className="flex justify-center">
                  <HolographicButton
                    onClick={handleRunSimulation}
                    size="lg"
                    className="w-full sm:w-auto"
                    glow
                    disabled={isLoading}
                  >
                    <div className="flex items-center">
                      {isLoading ? (
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
          )}
        </GlassCard>

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