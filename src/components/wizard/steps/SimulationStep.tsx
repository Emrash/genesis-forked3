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
        <div className="text-center mb-8 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Simulation Lab
          </h1>
          <p className="text-lg text-gray-600">
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