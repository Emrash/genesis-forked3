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
  const { workflowNodes, workflowEdges } = useEnhancedCanvasStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'design' | 'monitor' | 'debug'>('design');
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  
  const {
    nodes,
    edges,
    loadCanvasFromBlueprint,
    saveCanvas,
    executeWorkflow,
    isLoading,
    error
  } = useCanvas();
  
  useEffect(() => {
    if (blueprint && nodes.length === 0) {
      loadCanvasFromBlueprint();
    }
  }, [blueprint, nodes.length, loadCanvasFromBlueprint]);
  
  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await executeWorkflow();
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    } finally {
      setTimeout(() => setIsExecuting(false), 5000);
    }
  };
  
  const handleSaveAndContinue = () => {
    saveCanvas();
    setStep('credentials');
  };
  
  return (
    <ReactFlowProvider>
      <div className="h-[calc(100vh-200px)]">
        <div className="flex space-x-2 mb-4">
          <HolographicButton
            variant={selectedTab === 'design' ? 'primary' : 'ghost'}
            onClick={() => setSelectedTab('design')}
          >
            <Workflow className="w-4 h-4 mr-2" />
            Design
          </HolographicButton>
        
        <HolographicButton
          variant={selectedTab === 'monitor' ? 'primary' : 'ghost'}
          onClick={() => setSelectedTab('monitor')}
        >
          <Activity className="w-4 h-4 mr-2" />
          Monitoring
        </HolographicButton>
        
        <HolographicButton
          variant={selectedTab === 'debug' ? 'primary' : 'ghost'}
          onClick={() => setSelectedTab('debug')}
        >
          <Zap className="w-4 h-4 mr-2" />
          Debug
        </HolographicButton>
        
        <div className="ml-auto">
          <HolographicButton
            variant="ghost"
            onClick={() => setShowVoiceInterface(!showVoiceInterface)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Voice
          </HolographicButton>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full h-full"
        >
          {selectedTab === 'design' && (
            <div className="h-full">
              <EnhancedQuantumCanvas
                blueprint={blueprint}
                initialNodes={workflowNodes}
                initialEdges={workflowEdges}
                onSave={saveCanvas}
                onExecute={handleExecute}
                isExecuting={isExecuting}
              />
            </div>
          )}
          
          {selectedTab === 'monitor' && (
            <WorkflowMonitoringDashboard 
              workflowId={blueprint?.id || 'workflow-1'} 
              nodes={nodes}
              edges={edges}
            />
          )}
          
          {selectedTab === 'debug' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              <AgentDebugConsole agents={blueprint?.suggested_structure.agents || []} />
              <AgentCommunicationVisualizer agents={blueprint?.suggested_structure.agents.map((a: any) => ({
                id: `agent-${a.name}`,
                name: a.name,
                role: a.role,
                description: a.description,
                status: 'active'
              })) || []} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
        {/* Bottom action buttons */}
        <div className="flex justify-between mt-6">
          <HolographicButton
            variant="outline"
            onClick={() => setStep('blueprint')}
          >
            Go Back to Blueprint
          </HolographicButton>
          
          <HolographicButton
            onClick={handleSaveAndContinue}
            glow
          >
            Continue to Credentials
            <ArrowRight className="w-5 h-5 ml-2" />
          </HolographicButton>
        </div>
      
        {showVoiceInterface && (
          <VoiceInterface 
            isVisible={showVoiceInterface}
            agentName={blueprint?.suggested_structure.guild_name || 'AI Assistant'}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
  
  return null;
};