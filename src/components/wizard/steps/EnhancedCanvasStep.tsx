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
  