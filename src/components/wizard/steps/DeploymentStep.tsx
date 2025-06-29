import React, { useEffect } from 'react';
import { CheckCircle, Sparkles, ArrowRight, Bot, Workflow, Brain, Rocket } from 'lucide-react';
import { useWizardStore } from '../../../stores/wizardStore';
import { GuildDeploymentPanel } from '../../deployment/GuildDeploymentPanel';
import { GlassCard } from '../../ui/GlassCard';
import { HolographicButton } from '../../ui/HolographicButton';
import { useState } from 'react';

export const DeploymentStep: React.FC = () => {
  const { 
    blueprint, 
    simulationResults,
    deploymentId,
    isLoading,
    deployGuild,
    reset,
    errors 
  } = useWizardStore();

  const [error, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // Only deploy if we have simulation results and haven't deployed yet
    if (simulationResults && !deploymentId && !isLoading) {
      deployGuild();
    }
  }, [simulationResults, deploymentId, isLoading, deployGuild]);

  // Handle successful deployment
  const handleDeploymentSuccess = (deploymentId: string) => {
    console.log('✅ Guild deployed successfully:', deploymentId);
    // You could store the deploymentId in the wizardStore if needed
  };

  // Handle deployment error
  const handleDeploymentError = (errorMessage: string) => {
    console.error('❌ Guild deployment failed:', errorMessage);
    setErrors([errorMessage]);
  };

  const handleGoToDashboard = () => {
    reset();
    // In a real app, this would navigate to the dashboard
    window.location.href = '/dashboard';
  };

  const handleCreateAnother = () => {
    reset();
  };

  const isDeploying = isLoading || (!deploymentId && simulationResults);
  const isDeployed = deploymentId && !isLoading;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {isDeploying ? 'Deploying Your Guild...' : 'Guild Deployed Successfully!'}
          </h1>
          <p className="text-lg text-gray-600">
            {isDeploying 
              ? 'Setting up your AI-native infrastructure with intelligent agents'
              : 'Your autonomous digital workspace is live and ready for action'
            }
          </p>
        </div>

        {errors.length > 0 && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-6">
            {errors.join(', ')}
          </div>
        )}

        {isDeploying ? (
          blueprint ? (
            <GuildDeploymentPanel 
              blueprint={blueprint}
              onSuccess={handleDeploymentSuccess}
              onError={handleDeploymentError}
            />
          ) : null
        ) : isDeployed ? (
          <div className="space-y-6">
            <GlassCard variant="medium" className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mr-4">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-white text-xl font-bold">
                    {blueprint?.suggested_structure.guild_name}
                  </h2>
                  <p className="text-gray-300">
                    Guild ID: {deploymentId}
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-white mb-3 flex items-center">
                      <Bot className="w-5 h-5 mr-2 text-blue-400" />
                      Live AI Agents ({blueprint?.suggested_structure.agents.length})
                    </h4>
                    <ul className="space-y-2">
                      {blueprint?.suggested_structure.agents.map((agent, index) => (
                        <li key={index} className="flex items-center text-sm text-white">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                          <div>
                            <span className="font-medium">{agent.name}</span>
                            <span className="text-gray-300 ml-2">({agent.role})</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-3 flex items-center">
                      <Workflow className="w-5 h-5 mr-2 text-purple-400" />
                      Active Workflows ({blueprint?.suggested_structure.workflows.length})
                    </h4>
                    <ul className="space-y-2">
                      {blueprint?.suggested_structure.workflows.map((workflow, index) => (
                        <li key={index} className="flex items-center text-sm text-white">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                          <div>
                            <span className="font-medium">{workflow.name}</span>
                            <span className="text-xs text-gray-300 block">{workflow.trigger_type} trigger</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-700/30 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-300 mb-2">🎉 Your Guild is Live!</h5>
                  <p className="text-blue-200 text-sm">
                    All agents are active with memory systems enabled. They can process voice commands, 
                    maintain conversation context, and execute workflows autonomously. 
                    Performance metrics show {simulationResults?.execution_time}s average response time.
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard variant="medium" className="p-6">
              <div className="mb-6">
                <h2 className="text-white text-xl font-bold mb-2">🚀 What's Next?</h2>
              </div>
              
              <div>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div className="p-4">
                    <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Bot className="w-6 h-6 text-blue-400" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">Intelligent Interaction</h4>
                    <p className="text-sm text-gray-300">
                      Chat with your agents using natural language. They understand context and remember everything.
                    </p>
                  </div>
                  
                  <div className="p-4">
                    <div className="w-12 h-12 bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Brain className="w-6 h-6 text-purple-400" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">Adaptive Learning</h4>
                    <p className="text-sm text-gray-300">
                      Agents learn from every interaction, improving their responses and understanding over time.
                    </p>
                  </div>
                  
                  <div className="p-4">
                    <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Workflow className="w-6 h-6 text-green-400" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">Autonomous Execution</h4>
                    <p className="text-sm text-gray-300">
                      Workflows run automatically based on triggers, while agents collaborate to achieve complex goals.
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="flex justify-center space-x-4">
              <HolographicButton variant="outline" onClick={handleCreateAnother}>
                <Sparkles className="w-4 h-4 mr-2" />
                Create Another Guild
              </HolographicButton>
              <HolographicButton onClick={handleGoToDashboard} size="lg" glow>
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </HolographicButton>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};