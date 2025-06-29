import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlowProvider } from '@xyflow/react';
import { ArrowRight, Edit3, Play, Save, Sparkles, Brain, Zap, Target, Settings, Users, 
  Rocket, BarChart, Workflow, Star, Command, Bot, Clock, Database, DollarSign, FileText, 
  Globe, Heart, Mail, MessageSquare, Share2, Activity } from 'lucide-react';
import { useWizardStore } from '../../../stores/wizardStore';
import { useEnhancedCanvasStore } from '../../../stores/enhancedCanvasStore';
import { EnhancedQuantumCanvas } from '../../canvas/EnhancedQuantumCanvas';
import { GlassCard } from '../../ui/GlassCard';
import { HolographicButton } from '../../ui/HolographicButton';
import { VoiceInterface } from '../../voice/VoiceInterface';
import { WorkflowMonitoringDashboard } from '../../monitoring/WorkflowMonitoringDashboard';
import { AgentDebugConsole } from '../../debugging/AgentDebugConsole';
import { AgentCommunicationVisualizer } from '../../visualization/AgentCommunicationVisualizer';
import { SimulationLab } from '../../simulation/SimulationLab'; 
import { Node, Edge } from '@xyflow/react';
import { Blueprint } from '../../../types';
import { NodeData } from '../../../types/canvas';
import { useCanvas } from '../../../hooks/useCanvas';
import { CanvasEdge } from '../../../types/canvas';

export const EnhancedCanvasStep: React.FC = () => {
  const { blueprint, setStep } = useWizardStore();
  const { 
    workflowNodes, 
    workflowEdges, 
    setWorkflowNodes, 
    setWorkflowEdges 
  } = useEnhancedCanvasStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [currentTab, setCurrentTab] = useState<'canvas' | 'monitoring' | 'communication' | 'simulation'>('canvas');
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    saveCanvas,
    executeWorkflow,
    isLoading,
    error
  } = useCanvas();
  
  useEffect(() => {
    // Update enhancedCanvasStore when nodes or edges change
    if (nodes.length > 0) {
      setWorkflowNodes(nodes);
    }
    
    if (edges.length > 0) {
      setWorkflowEdges(edges as CanvasEdge[]);
    }
  }, [nodes, edges, setWorkflowNodes, setWorkflowEdges]);
  
  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    try {
      await executeWorkflow();
      setTimeout(() => {
        setIsExecuting(false);
      }, 5000); // Simulate execution time
    } catch (error) {
      console.error('Workflow execution failed:', error);
      setIsExecuting(false);
    }
  };
  
  const handleSaveCanvas = () => {
    saveCanvas();
    // Show success message or notification
  };
  
  const handleContinue = () => {
    setStep('credentials');
  };
  
  if (!blueprint) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto"
        >
          <Brain className="w-20 h-20 text-purple-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-6">Blueprint Required</h2>
          <p className="text-xl text-gray-300 mb-8">
            You need to generate a blueprint first. Let's go back to the intent step.
          </p>
          <HolographicButton onClick={() => setStep('intent')} variant="primary" glow>
            Start with Intent
          </HolographicButton>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="container-fluid p-0 relative">
      {/* Tab Navigation */}
      <div className="sticky top-0 z-20 bg-gray-900/90 backdrop-blur-sm border-b border-white/10 mb-4">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Workflow className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">
                {blueprint.suggested_structure.guild_name} Canvas
              </h2>
            </div>
            
            <div className="flex space-x-2">
              <HolographicButton
                variant={currentTab === 'canvas' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentTab('canvas')}
              >
                Canvas
              </HolographicButton>
              
              <HolographicButton
                variant={currentTab === 'monitoring' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentTab('monitoring')}
              >
                Monitoring
              </HolographicButton>
              
              <HolographicButton
                variant={currentTab === 'communication' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentTab('communication')}
              >
                Communication
              </HolographicButton>
              
              <HolographicButton
                variant={currentTab === 'simulation' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentTab('simulation')}
              >
                Simulation
              </HolographicButton>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content based on current tab */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="container mx-auto px-6 py-4"
        >
          {currentTab === 'canvas' && (
            <div className="mb-4">
              <div className="h-[70vh] border border-white/10 rounded-lg overflow-hidden mb-4">
                <EnhancedQuantumCanvas 
                  blueprint={blueprint}
                  initialNodes={workflowNodes.length > 0 ? workflowNodes : undefined}
                  initialEdges={workflowEdges.length > 0 ? workflowEdges : undefined}
                  onSave={handleSaveCanvas}
                  onExecute={handleExecuteWorkflow}
                  isExecuting={isExecuting}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <HolographicButton 
                  variant="outline"
                  onClick={() => setStep('blueprint')}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Back to Blueprint
                </HolographicButton>
                
                <div className="flex space-x-3">
                  <HolographicButton
                    variant="outline"
                    onClick={() => setShowVoiceInterface(!showVoiceInterface)}
                  >
                    Voice Interface
                  </HolographicButton>
                  
                  <HolographicButton
                    onClick={handleContinue}
                    glow
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </HolographicButton>
                </div>
              </div>
            </div>
          )}
          
          {currentTab === 'monitoring' && (
            <WorkflowMonitoringDashboard 
              workflowId="canvas-workflow"
              nodes={workflowNodes}
              edges={workflowEdges}
            />
          )}
          
          {currentTab === 'communication' && (
            <AgentCommunicationVisualizer
              agents={blueprint.suggested_structure.agents.map((agent, index) => ({
                id: `agent-${index + 1}`,
                name: agent.name,
                role: agent.role,
                description: agent.description || '',
                status: 'active' as const
              }))}
            />
          )}
          
          {currentTab === 'simulation' && (
            <SimulationLab 
              guildId={blueprint.suggested_structure.guild_name}
              agents={blueprint.suggested_structure.agents}
            />
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Voice Interface */}
      {showVoiceInterface && (
        <VoiceInterface
          agentName={blueprint.suggested_structure.agents[0]?.name || "AI Assistant"}
          isVisible={showVoiceInterface}
        />
      )}
    </div>
  );
};