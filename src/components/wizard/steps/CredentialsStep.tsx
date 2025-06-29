import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, 
  ArrowRight, 
  ExternalLink, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Code, 
  RefreshCw, 
  Volume2, 
  AlertTriangle, 
  Clipboard, 
  Edit3,
  Save,
  FileCode 
} from 'lucide-react';
import { useWizardStore } from '../../../stores/wizardStore';
import { GlassCard } from '../../ui/GlassCard';
import { HolographicButton } from '../../ui/HolographicButton';
import { apiService } from '../../../services/apiService';
import { credentialService } from '../../../services/credentialService';
import { VoiceSelector } from '../../voice/VoiceSelector';
import { voiceService } from '../../../services/voiceService';

export const CredentialsStep: React.FC = () => {
  const { currentStep, nextStep, updateStepData, stepData } = useWizardStore();
  const [credentials, setCredentials] = useState<{[key: string]: string}>(stepData?.credentials || {});
  const [showCredentials, setShowCredentials] = useState<{[key: string]: boolean}>({});
  const [curlCommands, setCurlCommands] = useState<{[key: string]: string}>({});
  const [editingCurl, setEditingCurl] = useState<{[key: string]: boolean}>({});
  const [validatedCredentials, setValidatedCredentials] = useState<{[key: string]: boolean}>({});
  const [isValidating, setIsValidating] = useState<{[key: string]: boolean}>({});
  const [generatingCurl, setGeneratingCurl] = useState<{[key: string]: boolean}>({});
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [userCurlInput, setUserCurlInput] = useState<{[key: string]: string}>({});
  const [showCurlInput, setShowCurlInput] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(false);

  // Rest of the component code...

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Component JSX */}
    </div>
  );
};