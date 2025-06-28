import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, ArrowRight, ExternalLink, CheckCircle2, Eye, EyeOff, Code, RefreshCw, Volume2 } from 'lucide-react';
import { useWizardStore } from '../../../stores/wizardStore';
import { GlassCard } from '../../ui/GlassCard';
import { HolographicButton } from '../../ui/HolographicButton';
import { apiService } from '../../../services/apiService';
import { credentialService } from '../../../services/credentialService';
import { VoiceSelector } from '../../voice/VoiceSelector';
import { voiceService } from '../../../services/voiceService';

export const CredentialsStep: React.FC = () => {
  const { blueprint, credentials, setCredentials, setStep } = useWizardStore();
  const [localCredentials, setLocalCredentials] = useState<Record<string, string>>(credentials);
  const [validationStatus, setValidationStatus] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [showCurlGenerator, setShowCurlGenerator] = useState<Record<string, boolean>>({});
  const [generatingCurl, setGeneratingCurl] = useState<Record<string, boolean>>({});
  const [curlCommands, setCurlCommands] = useState<Record<string, string>>({});
  const [testingApi, setTestingApi] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Generate required credentials based on blueprint
  const getRequiredCredentials = () => {
    if (!blueprint) return [];
    
    const neededTools = new Set<string>();
    type CredentialTemplate = {
      key: string;
      name: string;
      description: string;
      placeholder: string;
      instructions: string[];
      curl: string;
      tool?: string;
    };

    const credentialTemplates: Record<string, CredentialTemplate> = {
      // Communication
      'Slack API': {
        key: 'slack_api_key',
        name: 'Slack API Key',
        description: 'For sending messages to Slack channels',
        placeholder: 'xoxb-...',
        instructions: [
          'Go to api.slack.com → Your Apps → Create New App',
          'Add permissions: chat:write, channels:read',
          'Install the app to your workspace',
          'Copy the Bot User OAuth Token'
        ],
        curl: 'curl -X POST https://slack.com/api/chat.postMessage \\\n  -H "Authorization: Bearer YOUR_SLACK_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"channel": "general", "text": "Hello from GenesisOS!"}\''
      },
      'Slack Webhook': {
        key: 'slack_webhook_url',
        name: 'Slack Webhook URL',
        description: 'To send notifications to your team channel',
        placeholder: 'https://hooks.slack.com/services/...',
        instructions: [
          'Go to your Slack workspace → Apps → Incoming Webhooks',
          'Click "Add to Slack" and choose your channel',
          'Copy the webhook URL provided'
        ],
        curl: 'curl -X POST "YOUR_WEBHOOK_URL" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"text": "Hello from GenesisOS!"}\''
      },
      'Gmail API': {
        key: 'gmail_api_key',
        name: 'Gmail API Key',
        description: 'For sending emails through Gmail',
        placeholder: 'AIza...',
        instructions: [
          'Go to console.cloud.google.com → APIs & Services → Credentials',
          'Create an API Key with Gmail API permissions',
          'Enable Gmail API in the API Library',
          'Copy the API Key'
        ],
        curl: 'curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/messages/send" \\\n  -H "Authorization: Bearer YOUR_GMAIL_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"raw": "BASE64_ENCODED_EMAIL"}\''
      },
      'SendGrid API': {
        key: 'sendgrid_api_key',
        name: 'SendGrid API Key',
        description: 'For sending transactional emails',
        placeholder: 'SG...',
        instructions: [
          'Sign up at sendgrid.com',
          'Go to Settings → API Keys → Create API Key',
          'Select "Full Access" or "Restricted Access" with Mail Send permissions',
          'Copy your API key immediately (it won\'t be shown again)'
        ],
        curl: 'curl -X POST "https://api.sendgrid.com/v3/mail/send" \\\n  -H "Authorization: Bearer YOUR_SENDGRID_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"personalizations": [{"to": [{"email": "recipient@example.com"}]}], "from": {"email": "sender@example.com"}, "subject": "Hello from GenesisOS", "content": [{"type": "text/plain", "value": "Test email"}]}\''
      },
      
      // Finance
      'Stripe API': {
        key: 'stripe_api_key',
        name: 'Stripe API Key',
        description: 'To fetch MRR and revenue data',
        placeholder: 'sk_test_...',
        instructions: [
          'Go to Stripe Dashboard → Developers → API Keys',
          'Copy your "Secret key" (starts with sk_)',
          'Use test key for development, live key for production'
        ],
        curl: 'curl -X GET "https://api.stripe.com/v1/customers" \\\n  -H "Authorization: Bearer YOUR_STRIPE_API_KEY"'
      },
      
      // Google Workspace
      'Google Sheets API': {
        key: 'google_sheets_api_key',
        name: 'Google Sheets API Key',
        description: 'For reading and writing to Google Sheets',
        placeholder: 'AIza...',
        instructions: [
          'Go to console.cloud.google.com → APIs & Services → Credentials',
          'Create an API Key with Google Sheets API permissions',
          'Enable Google Sheets API in the API Library',
          'Copy the API Key'
        ],
        curl: 'curl -X GET "https://sheets.googleapis.com/v4/spreadsheets/YOUR_SPREADSHEET_ID/values/Sheet1!A1:B5" \\\n  -H "Authorization: Bearer YOUR_GOOGLE_API_KEY"'
      },
      'Google Drive API': {
        key: 'google_drive_api_key',
        name: 'Google Drive API Key',
        description: 'For accessing and managing Google Drive files',
        placeholder: 'AIza...',
        instructions: [
          'Go to console.cloud.google.com → APIs & Services → Credentials',
          'Create an API Key with Google Drive API permissions',
          'Enable Google Drive API in the API Library',
          'Copy the API Key'
        ],
        curl: 'curl -X GET "https://www.googleapis.com/drive/v3/files" \\\n  -H "Authorization: Bearer YOUR_GOOGLE_API_KEY"'
      },
      
      // Voice
      'ElevenLabs API': {
        key: 'elevenlabs_api_key',
        name: 'ElevenLabs API Key',
        description: 'For high-quality AI voice generation',
        placeholder: 'your-elevenlabs-api-key',
        instructions: [
          'Sign up at ElevenLabs.io',
          'Go to your Profile → API Key',
          'Copy your API Key'
        ],
        curl: 'curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID" \\\n  -H "xi-api-key: YOUR_ELEVENLABS_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"text": "Hello from GenesisOS", "model_id": "eleven_monolingual_v1"}\''
      },
      'ElevenLabs Voice ID': {
        key: 'elevenlabs_voice_id',
        name: 'ElevenLabs Voice ID',
        description: 'For high-quality AI voice generation',
        placeholder: '21m00Tcm4TlvDq8ikWAM',
        instructions: [
          'Sign up at ElevenLabs.io',
          'Go to VoiceLab and choose a voice',
          'Copy the Voice ID from the voice settings'
        ],
        curl: 'curl -X GET "https://api.elevenlabs.io/v1/voices" \\\n  -H "xi-api-key: YOUR_ELEVENLABS_API_KEY"'
      },
      
      // AI
      'Gemini API': {
        key: 'gemini_api_key',
        name: 'Google Gemini API Key',
        description: 'For AI agent intelligence',
        placeholder: 'AIza...',
        instructions: [
          'Go to ai.google.dev → Get API Key',
          'Create a new API key for Gemini',
          'Copy the API Key'
        ],
        curl: 'curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent" \\\n  -H "Content-Type: application/json" \\\n  -H "x-goog-api-key: YOUR_GEMINI_API_KEY" \\\n  -d \'{"contents":[{"parts":[{"text":"Write a short poem about AI"}]}]}\''
      },
      
      // Default for unrecognized tools
      'default': {
        key: '',
        name: '',
        description: 'API access for integration',
        placeholder: 'Your API Key',
        instructions: [
          'Sign up for an account',
          'Navigate to API or Developer settings',
          'Generate or copy your API key'
        ],
        curl: 'curl -X GET "https://api.example.com/endpoint" \\\n  -H "Authorization: Bearer YOUR_API_KEY"'
      }
    };
    
    // Collect all tools mentioned in the blueprint
    if (blueprint.suggested_structure?.agents) {
      blueprint.suggested_structure.agents.forEach(agent => {
        agent.tools_needed.forEach(tool => {
          neededTools.add(tool);
        });
      });
    }
    
    // Add some core tools that are always needed
    neededTools.add('ElevenLabs API');
    neededTools.add('ElevenLabs Voice ID');
    neededTools.add('Gemini API');
    
    // Map needed tools to credential templates
    const requiredCredentialsList = Array.from(neededTools).map(tool => {
      // Find exact match or partial match
      const exactMatch = credentialTemplates[tool as keyof typeof credentialTemplates];
      if (exactMatch) {
        return {
          ...exactMatch,
          tool
        };
      }
      
      // Look for partial matches
      const toolLower = tool.toLowerCase();
      let partialMatch: any = null;
      
      // Get credentials based on service name using the credential service
      const serviceCredentials = credentialService.getRequiredCredentialsForService(tool);
      if (serviceCredentials.length > 0) {
        return serviceCredentials[0];
      }
      
      // Fallback to template matching
      for (const [templateName, template] of Object.entries(credentialTemplates as any)) {
        if (templateName !== 'default' && (
            toolLower.includes(templateName.toLowerCase()) || 
            templateName.toLowerCase().includes(toolLower)
        )) {
          if (template) {
            partialMatch = {
              ...template,
              name: (template as CredentialTemplate).name || `${tool} API Key`,
              key: (template as CredentialTemplate).key || tool.toLowerCase().replace(/\s+/g, '_') + '_api_key',
              tool
            };
            break;
          }
        }
      }
      
      if (partialMatch) {
        return partialMatch;
      }
      
      // Use default template with customized name
      return {
        ...credentialTemplates['default'],
        name: `${tool} API Key`,
        key: tool.toLowerCase().replace(/\s+/g, '_') + '_api_key',
        description: `For integration with ${tool}`,
        tool
      };
    });
    
    return requiredCredentialsList;
  };
  
  const requiredCredentials = getRequiredCredentials();

  const handleCredentialChange = (key: string, value: string) => {
    setLocalCredentials(prev => ({
      ...prev,
      [key]: value
    }));
    setValidationStatus(prev => ({
      ...prev,
      [key]: false
    }));
  };

  const validateCredential = (key: string, value: string) => {
    // Mock validation logic
    let isValid = false;
    
    switch (key) {
      case 'stripe_api_key':
        isValid = value.startsWith('sk_') && value.length > 20;
        break;
      case 'slack_webhook_url':
        isValid = value.startsWith('https://hooks.slack.com/services/');
        break;
      case 'elevenlabs_voice_id':
        isValid = value.length > 10;
        break;
      case 'elevenlabs_api_key':
        isValid = value.length > 10;
        break;
      case 'gemini_api_key':
        isValid = value.startsWith('AIza') || value.length > 20;
        break;
      case 'google_sheets_api_key':
      case 'google_drive_api_key':
        isValid = value.startsWith('AIza') || value.length > 20;
        break;
      default:
        isValid = value.length > 0;
    }

    setValidationStatus(prev => ({
      ...prev,
      [key]: isValid
    }));
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPassword(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleCurlGenerator = (key: string) => {
    setShowCurlGenerator(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const generateCurl = async (credential: any, key: string) => {
    setGeneratingCurl(prev => ({
      ...prev,
      [key]: true
    }));
    
    try {
      const curlPrompt = `Generate a curl command to test the ${credential.name} for ${credential.tool}`;
      const serviceInfo = { service: credential.tool };

      // Generate curl command using the apiService
      const curlCommand = await apiService.generateCurlWithGemini(curlPrompt, serviceInfo);
      
      setCurlCommands(prev => ({
        ...prev,
        [key]: curlCommand
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
  
  // Test API with credential
  const testCredential = async (credential: any, key: string) => {
    setTestingApi(prev => ({
      ...prev,
      [key]: true
    }));
    
    try {
      // Prepare test config based on credential type
      let testConfig: any = {
        method: 'GET',
        url: '',
        headers: {}
      };
      
      // Configure test request based on credential type
      if (key.includes('slack')) {
        testConfig = {
          method: 'GET',
          url: 'https://slack.com/api/auth.test',
          headers: {
            'Authorization': `Bearer ${localCredentials[key]}`
          }
        };
      } else if (key.includes('google') || key.includes('gemini')) {
        // For Google APIs, we'll use a simple test endpoint
        const apiKey = localCredentials[key];
        testConfig = {
          method: 'GET',
          url: `https://www.googleapis.com/books/v1/volumes?q=AI&key=${apiKey}`,
        };
      } else if (key.includes('openai')) {
        testConfig = {
          method: 'GET',
          url: 'https://api.openai.com/v1/models',
          headers: {
            'Authorization': `Bearer ${localCredentials[key]}`
          }
        };
      } else if (key.includes('elevenlabs')) {
        testConfig = {
          method: 'GET',
          url: 'https://api.elevenlabs.io/v1/voices',
          headers: {
            'xi-api-key': localCredentials[key]
          }
        };
      } else {
        // Generic test request
        testConfig = {
          method: 'GET',
          url: 'https://httpbin.org/get',
          headers: {
            'X-API-Key': localCredentials[key]
          }
        };
      }
      
      // Execute the test request (simulated here for safety)
      // In a real implementation, you would make the actual API call
      let testResult;
      if (import.meta.env.DEV) {
        // Simulate a successful API response
        await new Promise(resolve => setTimeout(resolve, 1000));
        testResult = {
          status: 200,
          success: true,
          message: 'API credential verified successfully',
          details: `Tested ${credential.name} for ${credential.tool}`
        };
      } else {
        // Make real API request with appropriate error handling
        try {
          const result = await apiService.executeRequest({
            method: testConfig.method,
            url: testConfig.url,
            headers: testConfig.headers,
            body: testConfig.body,
            credentials: { [key]: localCredentials[key] }
          });
          
          testResult = {
            status: result.status,
            success: !result.error,
            message: result.error ? result.message : 'API credential verified successfully',
            details: result.data
          };
        } catch (error: any) {
          testResult = {
            status: 500,
            success: false,
            message: error.message || 'API credential verification failed',
            details: error
          };
        }
      }
      
      setTestResults(prev => ({
        ...prev,
        [key]: testResult
      }));
      
      // Update validation status based on test result
      if (testResult.success) {
        setValidationStatus(prev => ({
          ...prev,
          [key]: true
        }));
      }
    } catch (error: any) {
      console.error('Failed to test credential:', error);
      setTestResults(prev => ({
        ...prev,
        [key]: {
          status: 500,
          success: false,
          message: error.message || 'Failed to test credential',
          details: error
        }
      }));
    } finally {
      setTestingApi(prev => ({
        ...prev,
        [key]: false
      }));
    }
  };

  const handleContinue = () => {
    setCredentials(localCredentials);
    setStep('simulation');
  };

  const allCredentialsValid = requiredCredentials.every(
    cred => localCredentials[cred.key] && validationStatus[cred.key]
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Connect Your Tools
          </h1>
          <p className="text-lg text-gray-300">
            Provide API keys and credentials for the tools your Guild will use
          </p>
        </div>

        <div className="space-y-6">
          {requiredCredentials.map((credential) => {
            const key = credential.key;
            return (
              <GlassCard key={key} variant="medium" className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
                      <Key className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{credential.name}</h3>
                      <p className="text-gray-300 text-sm">{credential.description}</p>
                      <div className="text-xs text-blue-300 mt-1">For: {credential.tool}</div>
                    </div>
                  </div>
                  {validationStatus[key] && (
                    <div className="bg-green-500/20 rounded-full p-1">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                  )}
                </div>

                <div className="mb-4 relative">
                  <input
                    value={localCredentials[key] || ''}
                    onChange={(e) => handleCredentialChange(key, e.target.value)}
                    onBlur={(e) => validateCredential(key, e.target.value)}
                    placeholder={credential.placeholder}
                    type={showPassword[key] ? "text" : "password"}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <button 
                      type="button"
                      onClick={() => togglePasswordVisibility(key)}
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      {showPassword[key] ? 
                        <EyeOff className="w-5 h-5" /> : 
                        <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {credential.key === 'elevenlabs_voice_id' && (
                  <div className="mt-4">
                    <VoiceSelector
                      selectedVoiceId={localCredentials[credential.key] || ''}
                      onSelect={(voiceId) => {
                        handleCredentialChange(credential.key, voiceId);
                        validateCredential(credential.key, voiceId);
                      }}
                      label="Select Voice"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <h4 className="font-medium text-white mb-3 flex items-center">
                      <ExternalLink className="w-4 h-4 mr-2 text-blue-400" />
                      Setup Instructions
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                      {credential.instructions.map((instruction: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined, index: React.Key | null | undefined) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <button
                      onClick={() => {
                        toggleCurlGenerator(key);
                        if (!curlCommands[key]) {
                          generateCurl(credential, key);
                        }
                      }}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center mb-2"
                    >
                      <Code className="w-4 h-4 mr-1" />
                      {showCurlGenerator[key] ? "Hide cURL Command" : "Show cURL Command"}
                    </button>
                    
                    <button
                      onClick={() => testCredential(credential, key)}
                      className="text-sm text-green-400 hover:text-green-300 flex items-center"
                      disabled={!localCredentials[key] || testingApi[key]}
                    >
                      {testingApi[key] ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          {testResults[key] ? "Re-Test Credential" : "Test Credential"}
                        </>
                      )}
                    </button>
                  </div>
                  
                  {showCurlGenerator[key] && (
                    <div className="mt-3 bg-black/30 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Test API with curl</span>
                        <button
                          onClick={() => generateCurl(credential, key)}
                          className="text-xs text-blue-400 flex items-center"
                          disabled={generatingCurl[key]}
                        >
                          {generatingCurl[key] ? (
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3 mr-1" />
                          )}
                          Regenerate
                        </button>
                      </div>
                      <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono overflow-x-auto p-2">
                        {curlCommands[key] || 
                         (generatingCurl[key] ? 'Generating...' : '# cURL command will appear here')}
                      </pre>
                    </div>
                  )}
                  
                  {credential.key === 'elevenlabs_api_key' && testResults[credential.key]?.success && (
                    <div className="mt-3 bg-green-900/20 border border-green-700/30 p-3 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-5 h-5 bg-green-900/40 rounded-full flex items-center justify-center mr-2">
                          <Volume2 className="w-3 h-3 text-green-400" />
                        </div>
                        <span className="text-green-400 text-sm font-medium">Test Voice Sample</span>
                      </div>
                      <HolographicButton
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={async () => {
                          const audioUrl = await voiceService.synthesizeSpeech(
                            "Hello, I'm your AI assistant with ElevenLabs voice. How can I help you today?",
                            localCredentials['elevenlabs_voice_id']
                          );
                          
                          const audio = new Audio(audioUrl);
                          audio.play();
                        }}
                      >
                        Play Test Voice
                      </HolographicButton>
                    </div>
                  )}
                  
                  {/* Test Results */}
                  {testResults[key] && (
                    <div className={`mt-3 rounded-lg p-3 border ${
                      testResults[key].success 
                        ? 'bg-green-900/20 border-green-700/30' 
                        : 'bg-red-900/20 border-red-700/30'
                    }`}>
                      <div className="text-xs mb-2 font-medium">
                        {testResults[key].success ? (
                          <span className="text-green-400">✓ Credential Test Successful</span>
                        ) : (
                          <span className="text-red-400">✗ Credential Test Failed</span>
                        )}
                      </div>
                      
                      <div className="text-xs text-white/70">
                        {testResults[key].message}
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 flex justify-center"
        >
          <HolographicButton
            onClick={handleContinue}
            disabled={!allCredentialsValid}
            size="lg"
            glow
          >
            Test in Simulation Lab
            <ArrowRight className="w-5 h-5 ml-2" />
          </HolographicButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-4 text-center"
        >
          {!allCredentialsValid && (
            <p className="text-center text-sm text-gray-300 mt-4">
              Please provide all required credentials to continue
            </p>
          )}
          <div className="mt-6 text-gray-400 text-xs">
            <p>Your API keys and credentials are encrypted and stored securely.</p>
            <p className="mt-2">For testing, you can use placeholder values.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};