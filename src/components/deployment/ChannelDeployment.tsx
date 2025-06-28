import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessagesSquare, 
  Mail, 
  Globe, 
  Bookmark, 
  Check, 
  Copy, 
  RefreshCw,
  Slack,
  MessageSquare,
  Code,
  Cpu
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { deploymentService, Channel } from '../../services/deploymentService';

interface ChannelDeploymentProps {
  guildId: string;
  guildName: string;
  onDeploymentComplete?: (result: any) => void;
}

export const ChannelDeployment: React.FC<ChannelDeploymentProps> = ({
  guildId,
  guildName,
  onDeploymentComplete
}) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [newChannel, setNewChannel] = useState<Channel>({
    type: 'web',
    config: {},
    name: 'Web Widget'
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'channels' | 'configuration'>('channels');
  const [configStep, setConfigStep] = useState(1);
  
  const channelTypes = [
    { id: 'web', name: 'Web Widget', icon: Globe, description: 'Embed on your website' },
    { id: 'slack', name: 'Slack', icon: Slack, description: 'Connect to Slack workspace' },
    { id: 'email', name: 'Email', icon: Mail, description: 'Email integration' },
    { id: 'api', name: 'API', icon: Code, description: 'REST API access' },
    { id: 'discord', name: 'Discord', icon: MessageSquare, description: 'Discord bot integration' }
  ];
  
  const handleAddChannel = () => {
    // Create a copy of the new channel with a unique ID
    const channelToAdd = { 
      ...newChannel, 
      name: `${getChannelTypeName(newChannel.type)} ${channels.filter(c => c.type === newChannel.type).length + 1}`
    };
    
    setChannels([...channels, channelToAdd]);
    
    // Reset new channel form
    setNewChannel({
      type: 'web',
      config: {},
      name: 'Web Widget'
    });
  };
  
  const handleRemoveChannel = (index: number) => {
    const updatedChannels = [...channels];
    updatedChannels.splice(index, 1);
    setChannels(updatedChannels);
  };
  
  const handleChannelTypeChange = (type: Channel['type']) => {
    setNewChannel({
      ...newChannel,
      type,
      name: getChannelTypeName(type),
      config: getDefaultConfig(type)
    });
  };
  
  const handleConfigChange = (key: string, value: any) => {
    setNewChannel({
      ...newChannel,
      config: {
        ...newChannel.config,
        [key]: value
      }
    });
  };
  
  const handleDeployChannels = async () => {
    if (channels.length === 0) {
      setError('Please add at least one channel');
      return;
    }
    
    setIsDeploying(true);
    setError(null);
    
    try {
      const result = await deploymentService.createChannelDeployment(guildId, channels);
      
      setDeploymentResult(result);
      
      if (onDeploymentComplete) {
        onDeploymentComplete(result);
      }
    } catch (error: any) {
      console.error('Channel deployment failed:', error);
      setError(error.message || 'Failed to deploy channels');
    } finally {
      setIsDeploying(false);
    }
  };
  
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        alert('Code copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };
  
  // Helper to get channel type name
  const getChannelTypeName = (type: Channel['type']): string => {
    const channelType = channelTypes.find(t => t.id === type);
    return channelType ? channelType.name : 'Custom Channel';
  };
  
  // Helper to get default configuration for channel type
  const getDefaultConfig = (type: Channel['type']): Record<string, any> => {
    switch (type) {
      case 'slack':
        return { workspace_name: '', channel_name: '#general' };
      case 'email':
        return { email_address: '', signature: 'Powered by GenesisOS' };
      case 'web':
        return { theme: 'light', position: 'bottom-right', greeting: `Welcome! How can ${guildName} help you?` };
      case 'api':
        return { auth_method: 'api_key', rate_limit: 100 };
      case 'discord':
        return { server_name: '', channel_name: 'general' };
      default:
        return {};
    }
  };
  
  // Get web widget installation code
  const getWebWidgetCode = () => {
    const widgetConfig = {
      guildId,
      theme: 'light',
      position: 'bottom-right',
      greeting: `Welcome! How can ${guildName} help you?`
    };
    
    return `<script>
  (function(d, t) {
    var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
    g.src = "https://cdn.genesisOS.ai/widget.js";
    g.defer = true;
    g.async = true;
    g.onload = function() {
      window.GenesisWidget.init(${JSON.stringify(widgetConfig, null, 2)});
    };
    s.parentNode.insertBefore(g, s);
  })(document, 'script');
</script>`;
  };
  
  return (
    <GlassCard variant="medium" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Multi-Channel Deployment</h2>
            <p className="text-gray-300">Deploy your guild across multiple platforms</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <HolographicButton
            variant={currentTab === 'channels' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentTab('channels')}
          >
            Channels
          </HolographicButton>
          
          <HolographicButton
            variant={currentTab === 'configuration' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentTab('configuration')}
          >
            Configuration
          </HolographicButton>
        </div>
      </div>
      
      {currentTab === 'channels' && (
        <div className="space-y-6">
          {/* Channel Selection */}
          <div className="grid md:grid-cols-3 gap-4">
            {channelTypes.map((channelType) => (
              <motion.button
                key={channelType.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChannelTypeChange(channelType.id as Channel['type'])}
                className={`p-4 text-left rounded-lg border ${
                  newChannel.type === channelType.id
                    ? 'bg-white/10 border-purple-500/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                } transition-all`}
              >
                <channelType.icon className={`w-8 h-8 mb-2 ${
                  newChannel.type === channelType.id ? 'text-purple-400' : 'text-gray-400'
                }`} />
                <h3 className="text-white font-medium">{channelType.name}</h3>
                <p className="text-gray-400 text-sm">{channelType.description}</p>
              </motion.button>
            ))}
          </div>
          
          {/* Channel Configuration Form */}
          <GlassCard variant="subtle" className="p-4">
            <h3 className="text-white font-medium mb-3">Configure {getChannelTypeName(newChannel.type)}</h3>
            
            {newChannel.type === 'web' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Widget Position</label>
                  <select
                    value={newChannel.config.position}
                    onChange={(e) => handleConfigChange('position', e.target.value)}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Greeting Message</label>
                  <input
                    type="text"
                    value={newChannel.config.greeting}
                    onChange={(e) => handleConfigChange('greeting', e.target.value)}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="Welcome message"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Theme</label>
                  <select
                    value={newChannel.config.theme}
                    onChange={(e) => handleConfigChange('theme', e.target.value)}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
              </div>
            )}
            
            {newChannel.type === 'slack' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Workspace Name</label>
                  <input
                    type="text"
                    value={newChannel.config.workspace_name}
                    onChange={(e) => handleConfigChange('workspace_name', e.target.value)}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="Your Slack workspace"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Default Channel</label>
                  <input
                    type="text"
                    value={newChannel.config.channel_name}
                    onChange={(e) => handleConfigChange('channel_name', e.target.value)}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="#general"
                  />
                </div>
              </div>
            )}
            
            {newChannel.type === 'email' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newChannel.config.email_address}
                    onChange={(e) => handleConfigChange('email_address', e.target.value)}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="guild@yourdomain.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Email Signature</label>
                  <textarea
                    value={newChannel.config.signature}
                    onChange={(e) => handleConfigChange('signature', e.target.value)}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    rows={3}
                    placeholder="Email signature"
                  />
                </div>
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <HolographicButton
                onClick={handleAddChannel}
                variant="outline"
              >
                Add Channel
              </HolographicButton>
            </div>
          </GlassCard>
          
          {/* Channel List */}
          {channels.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-white font-medium">Selected Channels</h3>
              
              <div className="space-y-2">
                {channels.map((channel, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {channel.type === 'web' && <Globe className="w-5 h-5 text-blue-400" />}
                      {channel.type === 'slack' && <Slack className="w-5 h-5 text-purple-400" />}
                      {channel.type === 'email' && <Mail className="w-5 h-5 text-green-400" />}
                      {channel.type === 'api' && <Code className="w-5 h-5 text-orange-400" />}
                      {channel.type === 'discord' && <MessageSquare className="w-5 h-5 text-indigo-400" />}
                      
                      <div>
                        <div className="text-white font-medium">{channel.name}</div>
                        <div className="text-xs text-gray-400">
                          {Object.entries(channel.config)
                            .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
                            .join(' • ')
                          }
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveChannel(index)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end">
                <HolographicButton
                  onClick={handleDeployChannels}
                  disabled={isDeploying || channels.length === 0}
                  glow
                >
                  {isDeploying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4 mr-2" />
                      Deploy Channels
                    </>
                  )}
                </HolographicButton>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-900/20 border border-red-700/30 text-red-300 p-4 rounded-lg">
              {error}
            </div>
          )}
        </div>
      )}
      
      {currentTab === 'configuration' && (
        <div className="space-y-6">
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
                {configStep}
              </div>
              <h3 className="text-white font-medium">
                {configStep === 1 ? 'Web Widget Configuration' : 
                 configStep === 2 ? 'Slack Integration' :
                 'Email Configuration'}
              </h3>
            </div>
            
            {configStep === 1 && (
              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Add the following code to your website to embed your AI guild as a chat widget.
                </p>
                
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto">
                  <pre>{getWebWidgetCode()}</pre>
                </div>
                
                <div className="flex justify-end">
                  <HolographicButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCode(getWebWidgetCode())}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </HolographicButton>
                </div>
              </div>
            )}
            
            {configStep === 2 && (
              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Follow these steps to integrate your AI guild with Slack:
                </p>
                
                <ol className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs mr-2 mt-0.5">1</div>
                    <div>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">api.slack.com/apps</a> and create a new app.</div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs mr-2 mt-0.5">2</div>
                    <div>Add the "Bot Token Scopes" permissions: <code className="bg-gray-800 px-1 py-0.5 rounded text-xs">chat:write</code>, <code className="bg-gray-800 px-1 py-0.5 rounded text-xs">channels:history</code>, <code className="bg-gray-800 px-1 py-0.5 rounded text-xs">channels:read</code></div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs mr-2 mt-0.5">3</div>
                    <div>Install the app to your workspace and copy the Bot User OAuth Token.</div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs mr-2 mt-0.5">4</div>
                    <div>Add the token to your guild's credentials as "SLACK_API_KEY".</div>
                  </li>
                </ol>
              </div>
            )}
            
            {configStep === 3 && (
              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Configure your AI guild to send and receive emails:
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">SMTP Server</label>
                    <input
                      type="text"
                      placeholder="smtp.example.com"
                      className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">SMTP Port</label>
                    <input
                      type="text"
                      placeholder="587"
                      className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Email Address</label>
                    <input
                      type="text"
                      placeholder="guild@yourdomain.com"
                      className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Password</label>
                    <input
                      type="password"
                      className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-6">
              <HolographicButton
                variant="outline"
                size="sm"
                onClick={() => setConfigStep(prev => Math.max(1, prev - 1))}
                disabled={configStep === 1}
              >
                Previous
              </HolographicButton>
              
              <HolographicButton
                variant="outline"
                size="sm"
                onClick={() => setConfigStep(prev => Math.min(3, prev + 1))}
                disabled={configStep === 3}
              >
                Next
              </HolographicButton>
            </div>
          </div>
          
          <div className="flex justify-end">
            <HolographicButton
              onClick={() => setCurrentTab('channels')}
              variant="primary"
              glow
            >
              <MessagesSquare className="w-4 h-4 mr-2" />
              Back to Channels
            </HolographicButton>
          </div>
        </div>
      )}
      
      {/* Deployment Results */}
      {deploymentResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <h3 className="text-white font-medium mb-3 flex items-center">
            <Check className="w-5 h-5 text-green-400 mr-2" />
            Deployment Complete
          </h3>
          
          <div className="space-y-3">
            {deploymentResult.channels?.map((channel: any, index: number) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-white/10 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {channel.type === 'web' && <Globe className="w-5 h-5 text-blue-400" />}
                  {channel.type === 'slack' && <Slack className="w-5 h-5 text-purple-400" />}
                  {channel.type === 'email' && <Mail className="w-5 h-5 text-green-400" />}
                  {channel.type === 'api' && <Code className="w-5 h-5 text-orange-400" />}
                  {channel.type === 'discord' && <MessageSquare className="w-5 h-5 text-indigo-400" />}
                  
                  <div>
                    <div className="text-white">{channel.name}</div>
                    <div className="text-xs text-gray-400">Status: {channel.status}</div>
                  </div>
                </div>
                
                {channel.url && (
                  <HolographicButton
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(channel.url, '_blank')}
                  >
                    <Globe className="w-4 h-4" />
                  </HolographicButton>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </GlassCard>
  );
};