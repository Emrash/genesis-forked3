import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

  const requiredCredentials = [
    {
      name: 'Google Cloud API Key',
      key: 'google_cloud_api_key',
      tool: 'Google Cloud',
      placeholder: 'AIza...',
      description: 'For video generation, speech synthesis, and cloud services'
    },
    {
      name: 'OpenAI API Key',
      key: 'openai_api_key',
      tool: 'OpenAI',
      placeholder: 'sk-...',
      description: 'Required for AI agent interactions and natural language processing'
    },
    {
      name: 'Supabase URL',
      key: 'supabase_url',
      tool: 'Supabase',
      placeholder: 'https://...supabase.co',
      description: 'Your Supabase project URL for database operations'
    },
    {
      name: 'Supabase Anon Key',
      key: 'supabase_anon_key',
      tool: 'Supabase',
      placeholder: 'eyJ...',
      description: 'Public key for client-side Supabase operations'
    }
  ];
  
  // Load saved credentials on component mount
  useEffect(() => {
    if (stepData?.credentials) {
      setCredentials(stepData.credentials);
    }
    
    if (stepData?.selectedVoice) {
      setSelectedVoice(stepData.selectedVoice);
    }
  }, [stepData]);

  // Function to process a user-pasted cURL command and extract credentials
  const processCurlCommand = (key: string, curlCommand: string) => {
    console.log(`🔄 Processing user-pasted curl command for ${key}`);
    
    setCurlCommands(prev => ({
      ...prev,
      [key]: curlCommand
    }));
    
    // Try to extract credential from the curl command
    try {
      // Extract common authorization patterns
      const bearerMatch = curlCommand.match(/Bearer\s+([A-Za-z0-9._~+/-]+)/i);
      const apiKeyMatch = 
        curlCommand.match(/apikey[=:]\s*["']?([A-Za-z0-9._~+/-]+)["']?/i) || 
        curlCommand.match(/api[_-]?key[=:]\s*["']?([A-Za-z0-9._~+/-]+)["']?/i) || 
        curlCommand.match(/key[=:]\s*["']?([A-Za-z0-9._~+/-]+)["']?/i);
      const urlMatch = curlCommand.match(/"(https?:\/\/[^"]+)"/);
      
      // Extract the credential
      if (bearerMatch && bearerMatch[1]) {
        console.log('✅ Extracted Bearer token from curl command');
        handleCredentialChange(key, bearerMatch[1]);
        return true;
      } else if (apiKeyMatch && apiKeyMatch[1]) {
        console.log('✅ Extracted API key from curl command');
        handleCredentialChange(key, apiKeyMatch[1]);
        return true;
      } else if (urlMatch && urlMatch[1] && key.includes('url')) {
        console.log('✅ Extracted URL from curl command');
        handleCredentialChange(key, urlMatch[1]);
        return true;
      }
    } catch (error) {
      console.error('Error extracting credential from curl:', error);
    }
    
    return false;
  };

  const generateCurl = async (credential: any, key: string) => {
    setGeneratingCurl(prev => ({
      ...prev,
      [key]: true
    }));
    
    const existingValue = credentials[key] || '';
    const currentCurl = curlCommands[key] || '';
    
    try {
      const curlPrompt = `Generate a curl command to test the ${credential.name} for ${credential.tool}`;
      const serviceInfo = { 
        service: credential.tool,
        apiKey: existingValue && !existingValue.startsWith('your_') ? '{{' + key.toUpperCase() + '}}' : undefined,
        endpoint: credential.endpoint || (credential.tool === 'Supabase' ? '{{SUPABASE_URL}}' : undefined)
      };

      console.log(`🔄 Generating curl command for ${credential.name} using Gemini`);
      
      // Generate the curl command
      let generatedCurl: string;
      
      try {
        const result = await apiService.generateCurlWithGemini(curlPrompt, serviceInfo);
        generatedCurl = result.command;
        
        // Replace any specific values with template placeholders for better security and reusability
        if (existingValue && !existingValue.startsWith('your_')) {
          // Replace the actual API key with a placeholder
          generatedCurl = generatedCurl.replace(
            new RegExp(existingValue, 'g'), 
            `{{${key.toUpperCase()}}}`
          );
        }
        
        console.log(`✅ Curl command generated: ${generatedCurl.substring(0, 100)}...`);
      } catch (error) {
        console.error('Failed to generate curl command:', error);
        generatedCurl = `# Error generating curl command for ${credential.name}
curl -X POST "https://api.${credential.tool.toLowerCase().replace(/\s+/g, '')}.com/v1/endpoint" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{${key.toUpperCase()}}}" \\
  -d '{"query": "Test credential for ${credential.name}"}'`;
      }

      setCurlCommands(prev => ({
        ...prev,
        [key]: generatedCurl
      }));
      
      // Set editing mode true for the newly generated curl
      setEditingCurl(prev => ({
        ...prev,
        [key]: true
      }));
      
      // Show curl input for this credential
      setShowCurlInput(prev => ({
        ...prev,
        [key]: true
      }));
    } catch (error) {
      console.error('Failed to generate curl command:', error);
      setCurlCommands(prev => ({
        ...prev,
        [key]: `# Error generating curl command: ${error}`
      }));
    } finally {
      setGeneratingCurl(prev => ({
        ...prev,
        [key]: false
      }));
    }
  };

  const validateCredential = async (credential: any, value: string) => {
    if (!value.trim()) return;

    setIsValidating(prev => ({ ...prev, [credential.key]: true }));

    try {
      const isValid = await credentialService.validateCredential(credential.tool, credential.key, value);
      setValidatedCredentials(prev => ({ ...prev, [credential.key]: isValid }));
    } catch (error) {
      console.error('Validation failed:', error);
      setValidatedCredentials(prev => ({ ...prev, [credential.key]: false }));
    } finally {
      setIsValidating(prev => ({ ...prev, [credential.key]: false }));
    }
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
    setValidatedCredentials(prev => ({ ...prev, [key]: false }));
  };
  
  // Special handler for curl input change
  const handleCurlInputChange = (key: string, value: string) => {
    setUserCurlInput(prev => ({ ...prev, [key]: value }));
  };
  
  // Handle saving curl from input
  const handleSaveCurlFromInput = (key: string) => {
    const curlValue = userCurlInput[key];
    if (!curlValue) return;
    
    setCurlCommands(prev => ({ ...prev, [key]: curlValue }));
    processCurlCommand(key, curlValue);
    
    // Hide the input after saving
    setShowCurlInput(prev => ({ ...prev, [key]: false }));
  };
  
  // Handle curl command change
  const handleCurlChange = (key: string, value: string) => {
    setCurlCommands(prev => ({ ...prev, [key]: value }));
  };
  
  // Toggle curl editing mode
  const toggleCurlEdit = (key: string) => {
    const newValue = !editingCurl[key];
    setEditingCurl(prev => ({ ...prev, [key]: newValue }));
    
    // If we're exiting edit mode, try to extract the credential
    if (!newValue) {
      extractCredentialFromCurl(key);
    }
  };
  
  // Extract credential from curl command
  const extractCredentialFromCurl = (key: string) => {
    const curl = curlCommands[key] || '';
    
    // Extract common authorization patterns
    const bearerMatch = curl.match(/Bearer\s+([A-Za-z0-9._~+/-]+)/);
    const apiKeyMatch = curl.match(/apikey[=:]\s*["']?([A-Za-z0-9._~+/-]+)["']?/i) || 
                       curl.match(/api[_-]?key[=:]\s*["']?([A-Za-z0-9._~+/-]+)["']?/i) || 
                       curl.match(/key[=:]\s*["']?([A-Za-z0-9._~+/-]+)["']?/i);
    const urlMatch = curl.match(/"(https?:\/\/[^"]+)"/);
    
    if (bearerMatch && bearerMatch[1]) {
      console.log('✅ Extracted Bearer token from curl command');
      handleCredentialChange(key, bearerMatch[1]);
      return true;
    } else if (apiKeyMatch && apiKeyMatch[1]) {
      console.log('✅ Extracted API key from curl command');
      handleCredentialChange(key, apiKeyMatch[1]);
      return true;
    } else if (urlMatch && urlMatch[1] && key.includes('url')) {
      console.log('✅ Extracted URL from curl command');
      handleCredentialChange(key, urlMatch[1]);
      return true;
    }
    
    return false;
  };

  const toggleVisibility = (key: string) => {
    setShowCredentials(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  // Toggle showing curl input
  const toggleShowCurlInput = (key: string) => {
    setShowCurlInput(prev => ({ 
      ...prev, 
      [key]: !prev[key] 
    }));
    
    // Initialize user curl input with existing curl if available
    if (!userCurlInput[key] && curlCommands[key]) {
      setUserCurlInput(prev => ({ 
        ...prev, 
        [key]: curlCommands[key] 
      }));
    }
  };

  const handleNext = () => {
    const credentialsData = {
      credentials,
      validatedCredentials,
      selectedVoice
    };
    updateStepData('credentials', credentialsData);
    nextStep();
  };

  const allCredentialsValid = requiredCredentials.every(cred => 
    credentials[cred.key] && validatedCredentials[cred.key]
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Key className="w-16 h-16 text-emerald-400" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-black" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Configure API Credentials
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Secure your agent ecosystem with the necessary API keys and credentials for seamless integration.
          </p>
        </div>

        <div className="space-y-8">
          {requiredCredentials.map((credential, index) => (
            <motion.div
              key={credential.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                      {credential.name}
                      {validatedCredentials[credential.key] && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-2" />
                      )}
                    </h3>
                    <p className="text-gray-400 text-sm">{credential.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => generateCurl(credential, credential.key)}
                      disabled={generatingCurl[credential.key]}
                      className="p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 transition-colors"
                      title="Generate test curl command"
                    >
                      {generatingCurl[credential.key] ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Code className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={`https://docs.${credential.tool.toLowerCase().replace(' ', '')}.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
                      title="Open documentation"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showCredentials[credential.key] ? 'text' : 'password'}
                      value={credentials[credential.key] || ''}
                      onChange={(e) => handleCredentialChange(credential.key, e.target.value)}
                      onBlur={() => validateCredential(credential, credentials[credential.key])}
                      placeholder={credential.placeholder}
                      className="w-full px-4 py-3 pr-24 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
                      <button
                        onClick={() => toggleVisibility(credential.key)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showCredentials[credential.key] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      {isValidating[credential.key] ? (
                        <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin mt-2" />
                      ) : validatedCredentials[credential.key] ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-2" />
                      ) : credentials[credential.key] ? (
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-2" />
                      ) : null}
                    </div>
                  </div>
                  
                  {/* CURL Command Entry/Editor */}
                  <div className="bg-black/20 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Code className="w-4 h-4 text-purple-400 mr-2" />
                        <span className="text-sm text-gray-300 font-medium">cURL Command</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        {!generatingCurl[credential.key] && (
                          <HolographicButton
                            variant="ghost"
                            size="sm"
                            onClick={() => generateCurl(credential, credential.key)}
                            className="text-xs"
                          >
                {/* Toggle for pasting a curl command */}
                <div className="flex justify-end mb-1">
                  <button 
                    onClick={() => toggleShowCurlInput(credential.key)} 
                    className={`px-2 py-1 text-xs rounded-md flex items-center ${
                      showCurlInput[credential.key] 
                        ? 'bg-purple-500/30 text-purple-300' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    <FileCode className="w-3 h-3 mr-1" />
                    {showCurlInput[credential.key] ? 'Hide cURL' : 'Paste cURL'}
                  </button>
                </div>
                
                {/* cURL Input Area */}
                <AnimatePresence>
                  {showCurlInput[credential.key] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="relative mb-3">
                        <textarea 
                          value={userCurlInput[credential.key] || ''}
                          onChange={(e) => handleCurlInputChange(credential.key, e.target.value)}
                          placeholder="Paste your curl command here..."
                          className="w-full p-3 h-20 bg-black/30 border border-white/10 rounded text-xs font-mono text-green-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <div className="flex justify-end mt-2">
                          <HolographicButton 
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveCurlFromInput(credential.key)}
                            disabled={!userCurlInput[credential.key]}
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save & Extract
                          </HolographicButton>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                            <RefreshCw className={`w-3 h-3 mr-1 ${generatingCurl[credential.key] ? 'animate-spin' : ''}`} />
                <div className="bg-black/20 border border-white/10 rounded-lg p-3" style={{ display: curlCommands[credential.key] ? 'block' : 'none' }}>
                          </HolographicButton>
                        )}
                        
                        {curlCommands[credential.key] && !editingCurl[credential.key] && (
                          <HolographicButton
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCurlEdit(credential.key)}
                            className="text-xs"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </HolographicButton>
                        )}
                        
                        {curlCommands[credential.key] && editingCurl[credential.key] && (
                          <HolographicButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              toggleCurlEdit(credential.key);
                              extractCredentialFromCurl(credential.key);
                            }}
                            className="text-xs"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Save
                          </HolographicButton>
                        )}
                      </div>
                    </div>
                    
                    {editingCurl[credential.key] || !curlCommands[credential.key] ? (
                      <textarea
                        value={curlCommands[credential.key] || ''}
                        onChange={(e) => handleCurlChange(credential.key, e.target.value)}
                        placeholder="Paste your curl command here or generate one automatically"
                        rows={5}
                        className="w-full p-3 bg-black/30 border border-white/10 rounded text-xs font-mono text-green-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    ) : (
                      <pre className="p-3 bg-black/30 border border-white/10 rounded overflow-x-auto text-xs font-mono text-green-400">
                        {curlCommands[credential.key]}
                      </pre>
                    )}
                    
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>Paste your own curl or generate it</span>
                      
                      {curlCommands[credential.key] && (
                        <button
                          onClick={() => {
                      placeholder="Edit your curl command with placeholders like {{API_KEY}}"
                            extractCredentialFromCurl(credential.key);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors flex items-center"
                        >
                          <Clipboard className="w-3 h-3 mr-1" />
                          Copy & Extract Key
                        </button>
                      )}
                    </div>
                    
                    <span>
                      {editingCurl[credential.key] ? 
                        'Use {{PLACEHOLDERS}} for sensitive values' : 
                        'Commands will use credentials you provide'
                      }
                    </span>
                      <div className="flex items-center justify-center mt-2">
                        <RefreshCw className="w-4 h-4 text-purple-400 animate-spin mr-2" />
                        <span className="text-xs text-purple-400">Generating curl command...</span>
                      </div>
                    )}
                          // Don't automatically extract - let the user decide
                          console.log('Copied curl command to clipboard');
                  
                  {/* Error Display */}
                  {curlCommands[credential.key] && curlCommands[credential.key].includes('Error generating curl command') && (
                    <motion.div
                        Copy Command
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-xs text-red-300 bg-red-900/20 border border-red-900/30 p-2 rounded"
                    >
                      Failed to generate curl command. Please try again or paste your own.
                    </motion.div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}

          {/* Voice Configuration Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 flex items-center">
                    <Volume2 className="w-6 h-6 mr-2" />
                    Voice Configuration
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">Select the voice profile for your AI agents</p>
                </div>
              </div>

                    onClick={() => {
                      if (showCurlInput[credential.key]) {
                        // If curl input is already shown, hide it
                        setShowCurlInput(prev => ({ ...prev, [credential.key]: false }));
                      } else {
                        // If user hasn't manually pasted a curl yet, generate one
                        if (!curlCommands[credential.key]) {
                          generateCurl(credential, credential.key);
                        } else {
                          // Otherwise just show the existing one
                          setEditingCurl(prev => ({ ...prev, [credential.key]: true }));
                          setShowCurlInput(prev => ({ ...prev, [credential.key]: true }));
                        }
                      }
                    }}
                selectedVoiceId={selectedVoice}
                    className={`p-2 rounded-lg ${showCurlInput[credential.key] 
                      ? 'bg-purple-600/30 text-purple-300' 
                      : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400'} transition-colors`}
                className="z-10"
              />
            </GlassCard>
          </motion.div>

              <div className="space-y-2">
          <div className="flex justify-center pt-8 mt-4">
            <HolographicButton
              onClick={handleNext}
              disabled={false}
              className="px-8 py-4 text-lg"
              glow
            >
              <span className="flex items-center">
                {isLoading ? 'Saving Credentials...' : 'Continue to Blueprint Design'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </span>
            </HolographicButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
};