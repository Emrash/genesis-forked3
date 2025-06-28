import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  Clock, 
  Code, 
  Database, 
  FileText, 
  HelpCircle, 
  Play, 
  RefreshCw, 
  Search, 
  Settings, 
  Terminal, 
  X,
  ChevronDown,
  ChevronRight,
  Download,
  Copy,
  RotateCw,
  Eye,
  EyeOff,
  Brain,
  Layers,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Check
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';

interface AgentDebugConsoleProps {
  agentId: string;
  agentName: string;
  onClose?: () => void;
  className?: string;
}

// Types for debugging data
interface MemoryEntry {
  id: string;
  content: string;
  memory_type: string;
  importance_score: number;
  created_at: string;
}

interface AgentState {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'error' | 'initializing';
  last_active: string;
  current_session?: {
    id: string;
    start_time: string;
    user_id?: string;
  };
  memory_stats: {
    short_term_count: number;
    long_term_count: number;
    last_retrieval_time: number;
  };
  tool_usage: Record<string, {
    call_count: number;
    success_count: number;
    avg_response_time: number;
    last_used: string;
  }>;
  performance: {
    avg_response_time: number;
    requests_handled: number;
    errors: number;
  };
}

interface ConversationTurn {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    thinking?: string[];
    tools_used?: string[];
    memory_accessed?: string[];
    latency_ms?: number;
  };
}

interface DebugLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context: Record<string, any>;
}

export const AgentDebugConsole: React.FC<AgentDebugConsoleProps> = ({
  agentId,
  agentName,
  onClose,
  className = ''
}) => {
  // Debugging state
  const [selectedTab, setSelectedTab] = useState<'state' | 'memory' | 'conversation' | 'logs' | 'tools'>('state');
  const [isLoading, setIsLoading] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  
  // Agent state
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  
  // Memory entries
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [memoryFilter, setMemoryFilter] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);
  
  // Conversation history
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [expandedTurns, setExpandedTurns] = useState<Record<string, boolean>>({});
  const [showThinking, setShowThinking] = useState(true);
  
  // Debug logs
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'debug'>('all');
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  
  // Tool calls
  const [toolCalls, setToolCalls] = useState<any[]>([]);
  
  // Fetch agent state on mount
  useEffect(() => {
    fetchAgentState();
    fetchMemories();
    fetchConversation();
    fetchLogs();
    fetchToolCalls();
  }, [agentId]);
  
  // Fetch agent state
  const fetchAgentState = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock data
      const mockState: AgentState = {
        id: agentId,
        name: agentName,
        status: 'active',
        last_active: new Date().toISOString(),
        current_session: {
          id: `session-${Date.now()}`,
          start_time: new Date(Date.now() - 3600000).toISOString()
        },
        memory_stats: {
          short_term_count: Math.floor(Math.random() * 50) + 10,
          long_term_count: Math.floor(Math.random() * 200) + 50,
          last_retrieval_time: Math.floor(Math.random() * 300) + 50
        },
        tool_usage: {
          'API Tool': {
            call_count: Math.floor(Math.random() * 100) + 20,
            success_count: Math.floor(Math.random() * 90) + 10,
            avg_response_time: Math.floor(Math.random() * 300) + 100,
            last_used: new Date(Date.now() - 300000).toISOString()
          },
          'Database Tool': {
            call_count: Math.floor(Math.random() * 80) + 10,
            success_count: Math.floor(Math.random() * 70) + 10,
            avg_response_time: Math.floor(Math.random() * 200) + 50,
            last_used: new Date(Date.now() - 600000).toISOString()
          },
          'Email Tool': {
            call_count: Math.floor(Math.random() * 20) + 5,
            success_count: Math.floor(Math.random() * 15) + 5,
            avg_response_time: Math.floor(Math.random() * 500) + 200,
            last_used: new Date(Date.now() - 1200000).toISOString()
          }
        },
        performance: {
          avg_response_time: Math.floor(Math.random() * 500) + 200,
          requests_handled: Math.floor(Math.random() * 1000) + 100,
          errors: Math.floor(Math.random() * 20)
        }
      };
      
      setAgentState(mockState);
    } catch (error) {
      console.error('Failed to fetch agent state:', error);
      addConsoleOutput(`Error fetching agent state: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch agent memories
  const fetchMemories = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate mock memory data
      const mockMemories = Array.from({ length: 20 }, (_, i) => {
        const types = ['conversation', 'knowledge', 'reflection', 'plan', 'external'];
        const randomContent = [
          'User asked about product pricing',
          'Customer support request for order #45782',
          'User expressed satisfaction with quick response',
          'Information about enterprise pricing tiers',
          'Plan to follow up with user about their integration needs',
          'External data from CRM about customer history',
          'User mentioned they work at Acme Corp',
          'Reflected on improving response time for technical queries',
          'Knowledge about product limitations and workarounds',
          'User demographic information for personalization'
        ];
        
        return {
          id: `memory-${i}`,
          content: randomContent[Math.floor(Math.random() * randomContent.length)],
          memory_type: types[Math.floor(Math.random() * types.length)],
          importance_score: Number(Math.random().toFixed(2)),
          created_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
        };
      });
      
      setMemories(mockMemories);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
      addConsoleOutput(`Error fetching memories: ${error}`);
    }
  };
  
  // Fetch conversation history
  const fetchConversation = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Generate mock conversation
      const mockConversation: ConversationTurn[] = [
        {
          id: 'turn-1',
          role: 'user',
          content: 'Hi, can you tell me about your pricing?',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'turn-2',
          role: 'agent',
          content: 'Hello! I\'d be happy to tell you about our pricing. We offer three tiers: Basic ($10/month), Pro ($30/month), and Enterprise (custom pricing). Each tier comes with different features and limits. Which would you like to know more about?',
          timestamp: new Date(Date.now() - 3590000).toISOString(),
          metadata: {
            thinking: [
              'User is asking about pricing information',
              'We have three pricing tiers: Basic, Pro, and Enterprise',
              'Should provide a brief overview and ask for specific interests',
              'Check if user is existing customer or new user',
              'No specific tier mentioned, so provide general information'
            ],
            tools_used: ['Product Database', 'Pricing Calculator'],
            memory_accessed: ['Previous pricing discussions', 'User profile'],
            latency_ms: 420
          }
        },
        {
          id: 'turn-3',
          role: 'user',
          content: 'What features are included in the Pro tier?',
          timestamp: new Date(Date.now() - 3500000).toISOString()
        },
        {
          id: 'turn-4',
          role: 'agent',
          content: 'The Pro tier at $30/month includes: 1) Unlimited projects, 2) Up to 10 team members, 3) Advanced analytics, 4) Priority support, 5) API access with 10,000 requests/month, 6) Custom integrations with popular tools, and 7) 30-day data retention. It\'s our most popular option for small to medium-sized teams. Would you like to know more about any specific feature?',
          timestamp: new Date(Date.now() - 3490000).toISOString(),
          metadata: {
            thinking: [
              'User is specifically interested in Pro tier features',
              'Pro tier has 7 main features that should be highlighted',
              'Should mention it\'s our most popular option',
              'Should be prepared for follow-up questions about specific features',
              'Formatting as a list will make it easier to read'
            ],
            tools_used: ['Product Database', 'Feature Comparison Tool'],
            memory_accessed: ['Pro tier specifications', 'Common feature questions'],
            latency_ms: 380
          }
        }
      ];
      
      setConversation(mockConversation);
      
      // Set first turn as expanded by default
      setExpandedTurns({
        'turn-2': true
      });
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      addConsoleOutput(`Error fetching conversation: ${error}`);
    }
  };
  
  // Fetch debug logs
  const fetchLogs = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock logs
      const logLevels = ['info', 'warn', 'error', 'debug'] as const;
      const mockMessages = [
        'Agent initialized',
        'Processing user input',
        'Retrieved 3 memories from short-term memory',
        'Retrieved 2 memories from long-term memory',
        'Generated response in 342ms',
        'Failed to connect to external API',
        'Tool execution timeout',
        'Memory storage successful',
        'Embedding generation complete',
        'Response sent to user'
      ];
      
      const mockLogs: DebugLogEntry[] = Array.from({ length: 30 }, (_, i) => {
        const level = logLevels[Math.floor(Math.random() * logLevels.length)];
        const message = mockMessages[Math.floor(Math.random() * mockMessages.length)];
        
        return {
          id: `log-${i}`,
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          level,
          message,
          context: {
            agent_id: agentId,
            session_id: `session-${Date.now()}`,
            user_id: `user-${Math.floor(Math.random() * 1000)}`,
            request_id: `req-${Math.floor(Math.random() * 10000)}`
          }
        };
      });
      
      setLogs(mockLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      addConsoleOutput(`Error fetching logs: ${error}`);
    }
  };
  
  // Fetch tool calls
  const fetchToolCalls = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock tool calls
      const mockToolCalls = Array.from({ length: 10 }, (_, i) => {
        const tools = ['Google Search', 'Database Query', 'Email Sender', 'API Request', 'Calculator'];
        const tool = tools[Math.floor(Math.random() * tools.length)];
        const statuses = ['success', 'error', 'timeout'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        return {
          id: `tool-call-${i}`,
          tool,
          input: `{"query": "${tool === 'Google Search' ? 'product pricing' : 
                  tool === 'Database Query' ? 'SELECT * FROM products' : 
                  tool === 'Email Sender' ? 'subject: Your Inquiry' : 
                  tool === 'API Request' ? 'GET /api/products' : 
                  'calculate 15% of 99.99'}"}`,
          output: status === 'success' 
            ? `{"status": "success", "data": ${JSON.stringify({result: 'Mock data for ' + tool})}}`
            : status === 'error'
            ? `{"status": "error", "message": "Failed to execute ${tool}"}`
            : `{"status": "timeout", "message": "${tool} execution timed out after 3000ms"}`,
          status,
          duration_ms: Math.floor(Math.random() * 1000) + 100,
          timestamp: new Date(Date.now() - i * 300000).toISOString()
        };
      });
      
      setToolCalls(mockToolCalls);
    } catch (error) {
      console.error('Failed to fetch tool calls:', error);
      addConsoleOutput(`Error fetching tool calls: ${error}`);
    }
  };
  
  // Add console output
  const addConsoleOutput = (message: string) => {
    setConsoleOutput(prev => [...prev, message]);
  };
  
  // Run test input
  const handleTestInput = async () => {
    if (!testInput.trim()) return;
    
    addConsoleOutput(`> ${testInput}`);
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock response
      const mockResponse = `Agent ${agentName} processed: "${testInput}"`;
      addConsoleOutput(mockResponse);
      
      // Clear test input
      setTestInput('');
      
      // Update conversation with new turns
      const newUserTurn: ConversationTurn = {
        id: `turn-${conversation.length + 1}`,
        role: 'user',
        content: testInput,
        timestamp: new Date().toISOString()
      };
      
      const newAgentTurn: ConversationTurn = {
        id: `turn-${conversation.length + 2}`,
        role: 'agent',
        content: `I'll help you with that. ${testInput.includes('?') ? 'To answer your question' : 'Based on your request'}, I need to consider several factors.`,
        timestamp: new Date().toISOString(),
        metadata: {
          thinking: [
            'Processing user input',
            'Determining intent and entities',
            'Retrieving relevant context',
            'Formulating response strategy',
            'Generating natural language response'
          ],
          tools_used: ['Intent Classifier', 'Entity Extractor'],
          memory_accessed: ['User preferences', 'Conversation history'],
          latency_ms: Math.floor(Math.random() * 500) + 300
        }
      };
      
      setConversation([...conversation, newUserTurn, newAgentTurn]);
      setExpandedTurns({
        ...expandedTurns,
        [newAgentTurn.id]: true
      });
      
    } catch (error) {
      console.error('Test input error:', error);
      addConsoleOutput(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle thinking display
  const toggleThinking = () => {
    setShowThinking(!showThinking);
  };
  
  // Toggle conversation turn expansion
  const toggleTurn = (id: string) => {
    setExpandedTurns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Toggle log expansion
  const toggleLog = (id: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Render state tab
  const renderStateTab = () => {
    if (!agentState) {
      return (
        <div className="flex items-center justify-center py-10">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Agent Status */}
        <GlassCard variant="subtle" className="p-4">
          <h4 className="text-white font-medium mb-3 flex items-center">
            <Brain className="w-5 h-5 text-purple-400 mr-2" />
            Agent Status
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  agentState.status === 'active' ? 'bg-green-400' :
                  agentState.status === 'paused' ? 'bg-yellow-400' :
                  agentState.status === 'error' ? 'bg-red-400' :
                  'bg-blue-400 animate-pulse'
                }`} />
                <span className="text-white capitalize">{agentState.status}</span>
              </div>
            </div>
            
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Last Active</div>
              <div className="text-white">
                {new Date(agentState.last_active).toLocaleTimeString()}
              </div>
            </div>
            
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Session ID</div>
              <div className="text-white font-mono text-sm truncate">
                {agentState.current_session?.id || 'No active session'}
              </div>
            </div>
            
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Session Duration</div>
              <div className="text-white">
                {agentState.current_session
                  ? `${Math.round((Date.now() - new Date(agentState.current_session.start_time).getTime()) / 60000)}m`
                  : 'N/A'
                }
              </div>
            </div>
          </div>
        </GlassCard>
        
        {/* Performance Metrics */}
        <GlassCard variant="subtle" className="p-4">
          <h4 className="text-white font-medium mb-3 flex items-center">
            <BarChart3 className="w-5 h-5 text-blue-400 mr-2" />
            Performance Metrics
          </h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Avg Response Time</div>
              <div className="text-white font-semibold">
                {agentState.performance.avg_response_time}ms
              </div>
            </div>
            
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Requests Handled</div>
              <div className="text-white font-semibold">
                {agentState.performance.requests_handled}
              </div>
            </div>
            
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Errors</div>
              <div className="text-red-400 font-semibold">
                {agentState.performance.errors}
              </div>
            </div>
          </div>
        </GlassCard>
        
        {/* Memory Stats */}
        <GlassCard variant="subtle" className="p-4">
          <h4 className="text-white font-medium mb-3 flex items-center">
            <Database className="w-5 h-5 text-emerald-400 mr-2" />
            Memory Statistics
          </h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Short-term Memories</div>
              <div className="text-white font-semibold">
                {agentState.memory_stats.short_term_count}
              </div>
            </div>
            
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Long-term Memories</div>
              <div className="text-white font-semibold">
                {agentState.memory_stats.long_term_count}
              </div>
            </div>
            
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Retrieval Time</div>
              <div className="text-white font-semibold">
                {agentState.memory_stats.last_retrieval_time}ms
              </div>
            </div>
          </div>
        </GlassCard>
        
        {/* Tool Usage */}
        <GlassCard variant="subtle" className="p-4">
          <h4 className="text-white font-medium mb-3 flex items-center">
            <Settings className="w-5 h-5 text-yellow-400 mr-2" />
            Tool Usage
          </h4>
          
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 border-b border-white/10">
                <th className="pb-2 font-medium">Tool</th>
                <th className="pb-2 font-medium text-center">Calls</th>
                <th className="pb-2 font-medium text-center">Success Rate</th>
                <th className="pb-2 font-medium text-center">Avg Response</th>
                <th className="pb-2 font-medium text-right">Last Used</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(agentState.tool_usage).map(([tool, stats]) => (
                <tr key={tool} className="border-b border-white/5">
                  <td className="py-3 text-white">{tool}</td>
                  <td className="py-3 text-center text-blue-300">{stats.call_count}</td>
                  <td className="py-3 text-center">
                    <span className={`${
                      stats.success_count / stats.call_count > 0.9 ? 'text-green-400' :
                      stats.success_count / stats.call_count > 0.7 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {Math.round(stats.success_count / stats.call_count * 100)}%
                    </span>
                  </td>
                  <td className="py-3 text-center text-white">{stats.avg_response_time}ms</td>
                  <td className="py-3 text-right text-gray-400">
                    {new Date(stats.last_used).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>
    );
  };
  
  // Render memory tab
  const renderMemoryTab = () => {
    const filteredMemories = memories.filter(memory => 
      memory.content.toLowerCase().includes(memoryFilter.toLowerCase()) ||
      memory.memory_type.toLowerCase().includes(memoryFilter.toLowerCase())
    );
    
    return (
      <div className="space-y-6">
        {/* Search and Filter */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              value={memoryFilter}
              onChange={e => setMemoryFilter(e.target.value)}
              placeholder="Search memories..."
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <HolographicButton
            variant="outline"
            size="sm"
            onClick={fetchMemories}
          >
            <RefreshCw className="w-4 h-4" />
          </HolographicButton>
        </div>
        
        {/* Memory List and Details */}
        <div className="grid grid-cols-5 gap-6">
          {/* Memory List */}
          <div className="col-span-2 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h5 className="text-white font-medium">Memory Entries</h5>
              <span className="text-xs text-gray-400">{filteredMemories.length} entries</span>
            </div>
            
            <div className="p-2 max-h-96 overflow-y-auto space-y-2">
              {filteredMemories.map(memory => (
                <div
                  key={memory.id}
                  className={`p-2 rounded-lg cursor-pointer border ${
                    selectedMemory === memory.id 
                      ? 'bg-blue-500/20 border-blue-500/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  } transition-colors`}
                  onClick={() => setSelectedMemory(memory.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        memory.memory_type === 'conversation' ? 'bg-blue-400' :
                        memory.memory_type === 'knowledge' ? 'bg-green-400' :
                        memory.memory_type === 'reflection' ? 'bg-purple-400' :
                        memory.memory_type === 'plan' ? 'bg-yellow-400' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-white text-sm capitalize">
                        {memory.memory_type}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(memory.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 text-sm truncate">
                    {memory.content}
                  </p>
                </div>
              ))}
              
              {filteredMemories.length === 0 && (
                <div className="text-gray-400 text-center py-6">
                  {memoryFilter
                    ? 'No memories match your search'
                    : 'No memories found'
                  }
                </div>
              )}
            </div>
          </div>
          
          {/* Memory Details */}
          <div className="col-span-3 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h5 className="text-white font-medium">Memory Details</h5>
              {selectedMemory && (
                <div className="flex space-x-2">
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4">
              {selectedMemory ? (
                <>
                  {/* Selected Memory */}
                  {(() => {
                    const memory = memories.find(m => m.id === selectedMemory);
                    if (!memory) return null;
                    
                    return (
                      <div className="space-y-4">
                        <div>
                          <h6 className="text-gray-400 text-sm mb-1">Content</h6>
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-white">
                            {memory.content}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h6 className="text-gray-400 text-sm mb-1">Memory Type</h6>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-white capitalize">
                              {memory.memory_type}
                            </div>
                          </div>
                          
                          <div>
                            <h6 className="text-gray-400 text-sm mb-1">Importance Score</h6>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-white">
                              {memory.importance_score}
                            </div>
                          </div>
                          
                          <div>
                            <h6 className="text-gray-400 text-sm mb-1">Created At</h6>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-white">
                              {new Date(memory.created_at).toLocaleString()}
                            </div>
                          </div>
                          
                          <div>
                            <h6 className="text-gray-400 text-sm mb-1">Memory ID</h6>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-white font-mono text-xs truncate">
                              {memory.id}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="pt-4 flex justify-end space-x-3">
                          <HolographicButton
                            variant="outline"
                            size="sm"
                          >
                            Edit Importance
                          </HolographicButton>
                          
                          <HolographicButton
                            variant="outline"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete Memory
                          </HolographicButton>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a memory to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render conversation tab
  const renderConversationTab = () => {
    return (
      <div className="space-y-6">
        {/* Conversation Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HolographicButton
              variant="outline"
              size="sm"
              onClick={toggleThinking}
            >
              {showThinking ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Thinking
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show Thinking
                </>
              )}
            </HolographicButton>
            
            <HolographicButton
              variant="outline"
              size="sm"
              onClick={fetchConversation}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </HolographicButton>
          </div>
          
          <div>
            <HolographicButton
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Conversation
            </HolographicButton>
          </div>
        </div>
        
        {/* Conversation History */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {conversation.map((turn) => (
            <div
              key={turn.id}
              className={`p-4 rounded-lg border ${
                turn.role === 'user' 
                  ? 'bg-blue-500/10 border-blue-500/30 ml-12' 
                  : turn.role === 'system'
                  ? 'bg-gray-500/10 border-gray-500/30'
                  : 'bg-purple-500/10 border-purple-500/30 mr-12'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className={`capitalize font-semibold ${
                    turn.role === 'user' ? 'text-blue-400' :
                    turn.role === 'system' ? 'text-gray-400' :
                    'text-purple-400'
                  }`}>
                    {turn.role}
                  </span>
                  <span className="text-xs text-gray-400 ml-3">
                    {new Date(turn.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {turn.metadata && (
                  <button
                    onClick={() => toggleTurn(turn.id)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {expandedTurns[turn.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                )}
              </div>
              
              <div className="text-white">
                {turn.content}
              </div>
              
              <AnimatePresence>
                {turn.metadata && expandedTurns[turn.id] && showThinking && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 pt-3 border-t border-white/10 overflow-hidden"
                  >
                    {/* Thinking Process */}
                    {turn.metadata.thinking && (
                      <div className="mb-3">
                        <h6 className="text-blue-400 text-sm flex items-center mb-2">
                          <Brain className="w-4 h-4 mr-1" />
                          Thinking Process
                        </h6>
                        <div className="space-y-1 pl-4 text-gray-300 text-sm">
                          {turn.metadata.thinking.map((thought, idx) => (
                            <div key={idx} className="flex items-start">
                              <span className="text-blue-400 mr-2">{idx + 1}.</span>
                              <span>{thought}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {/* Tools Used */}
                      {turn.metadata.tools_used && (
                        <div>
                          <h6 className="text-green-400 text-sm flex items-center mb-2">
                            <Settings className="w-4 h-4 mr-1" />
                            Tools Used
                          </h6>
                          <div className="space-y-1 pl-2 text-gray-300">
                            {turn.metadata.tools_used.map((tool, idx) => (
                              <div key={idx} className="flex items-center">
                                <div className="w-1 h-1 rounded-full bg-green-400 mr-2"></div>
                                <span>{tool}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Memory Accessed */}
                      {turn.metadata.memory_accessed && (
                        <div>
                          <h6 className="text-purple-400 text-sm flex items-center mb-2">
                            <Database className="w-4 h-4 mr-1" />
                            Memory Accessed
                          </h6>
                          <div className="space-y-1 pl-2 text-gray-300">
                            {turn.metadata.memory_accessed.map((memory, idx) => (
                              <div key={idx} className="flex items-center">
                                <div className="w-1 h-1 rounded-full bg-purple-400 mr-2"></div>
                                <span>{memory}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Latency */}
                    {turn.metadata.latency_ms && (
                      <div className="mt-2 text-right text-xs text-gray-400">
                        Response generated in {turn.metadata.latency_ms}ms
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          
          {conversation.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No conversation history available</p>
            </div>
          )}
        </div>
        
        {/* Test Input */}
        <div>
          <div className="flex items-center space-x-3">
            <div className="flex-grow relative">
              <input
                type="text"
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleTestInput()}
                placeholder="Enter test input for the agent..."
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              {isLoading && (
                <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
              )}
            </div>
            
            <HolographicButton
              onClick={handleTestInput}
              disabled={!testInput.trim() || isLoading}
              glow
            >
              <Play className="w-4 h-4 mr-2" />
              Test
            </HolographicButton>
          </div>
        </div>
      </div>
    );
  };
  
  // Render logs tab
  const renderLogsTab = () => {
    // Filter logs based on selected level
    const filteredLogs = logs.filter(log => 
      logFilter === 'all' || log.level === logFilter
    );
    
    return (
      <div className="space-y-6">
        {/* Log Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <select
              value={logFilter}
              onChange={e => setLogFilter(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="error">Errors Only</option>
              <option value="warn">Warnings & Errors</option>
              <option value="info">Info & Above</option>
              <option value="debug">Debug & Above</option>
            </select>
            
            <HolographicButton
              variant="outline"
              size="sm"
              onClick={fetchLogs}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </HolographicButton>
          </div>
          
          <HolographicButton
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </HolographicButton>
        </div>
        
        {/* Log Entries */}
        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
          {filteredLogs.map(log => (
            <div
              key={log.id}
              className={`p-3 rounded-lg border ${
                log.level === 'error' ? 'bg-red-500/10 border-red-500/30' :
                log.level === 'warn' ? 'bg-yellow-500/10 border-yellow-500/30' :
                log.level === 'debug' ? 'bg-blue-500/10 border-blue-500/30' :
                'bg-white/5 border-white/10'
              }`}
            >
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleLog(log.id)}
              >
                <div className="flex items-center">
                  {log.level === 'error' && <AlertCircle className="w-4 h-4 text-red-400 mr-2" />}
                  {log.level === 'warn' && <AlertCircle className="w-4 h-4 text-yellow-400 mr-2" />}
                  {log.level === 'info' && <Check className="w-4 h-4 text-green-400 mr-2" />}
                  {log.level === 'debug' && <Code className="w-4 h-4 text-blue-400 mr-2" />}
                  
                  <span className={`${
                    log.level === 'error' ? 'text-red-300' :
                    log.level === 'warn' ? 'text-yellow-300' :
                    log.level === 'debug' ? 'text-blue-300' :
                    'text-white'
                  }`}>
                    {log.message}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {expandedLogs[log.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>
              
              <AnimatePresence>
                {expandedLogs[log.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 pt-3 border-t border-white/10 overflow-hidden"
                  >
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="text-gray-400">Timestamp:</span>
                        <span className="text-white ml-2">{new Date(log.timestamp).toISOString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Level:</span>
                        <span className={`ml-2 ${
                          log.level === 'error' ? 'text-red-300' :
                          log.level === 'warn' ? 'text-yellow-300' :
                          log.level === 'debug' ? 'text-blue-300' :
                          'text-green-300'
                        }`}>{log.level.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Context:</span>
                        <pre className="text-white text-xs bg-black/20 p-2 rounded-lg mt-1 overflow-auto">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No logs matching your filter criteria</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render tools tab
  const renderToolsTab = () => {
    return (
      <div className="space-y-6">
        {/* Tool Calls List */}
        <GlassCard variant="subtle" className="p-4">
          <h4 className="text-white font-medium mb-3 flex items-center">
            <Settings className="w-5 h-5 text-yellow-400 mr-2" />
            Recent Tool Calls
          </h4>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {toolCalls.map(call => (
              <div
                key={call.id}
                className={`p-3 rounded-lg border ${
                  call.status === 'success' ? 'border-green-500/30 bg-green-500/10' :
                  call.status === 'error' ? 'border-red-500/30 bg-red-500/10' :
                  'border-yellow-500/30 bg-yellow-500/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${
                      call.status === 'success' ? 'text-green-400' :
                      call.status === 'error' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {call.tool}
                    </span>
                    <span className="text-xs text-gray-400 ml-3">
                      {call.duration_ms}ms
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(call.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-400 mb-1">Input</div>
                    <pre className="bg-black/20 p-2 rounded-lg text-white text-xs overflow-auto max-h-32">
                      {call.input}
                    </pre>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 mb-1">Output</div>
                    <pre className={`p-2 rounded-lg text-xs overflow-auto max-h-32 ${
                      call.status === 'success' ? 'bg-green-950/30 text-green-300' :
                      call.status === 'error' ? 'bg-red-950/30 text-red-300' :
                      'bg-yellow-950/30 text-yellow-300'
                    }`}>
                      {call.output}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
            
            {toolCalls.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tool calls recorded</p>
              </div>
            )}
          </div>
        </GlassCard>
        
        {/* Tool Testing */}
        <GlassCard variant="subtle" className="p-4">
          <h4 className="text-white font-medium mb-3 flex items-center">
            <Code className="w-5 h-5 text-blue-400 mr-2" />
            Tool Testing
          </h4>
          
          <div className="text-center py-12">
            <Settings className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
            <p className="text-gray-400 mb-2">Tool testing interface coming soon</p>
            <p className="text-xs text-gray-500">
              You'll be able to test individual tools and see their responses
            </p>
          </div>
        </GlassCard>
      </div>
    );
  };
  
  return (
    <div className={`bg-gray-900 rounded-lg border border-white/10 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium">Agent Debug Console</h3>
            <div className="text-xs text-gray-400 flex items-center">
              {agentName}
              <span className="mx-2">•</span>
              <span className="text-blue-400">{agentId}</span>
            </div>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Navigation Tabs */}
      <div className="bg-gray-800 px-4 border-b border-white/10 flex">
        {[
          { id: 'state', label: 'State', icon: Layers },
          { id: 'memory', label: 'Memory', icon: Database },
          { id: 'conversation', label: 'Conversation', icon: MessageSquare },
          { id: 'logs', label: 'Logs', icon: FileText },
          { id: 'tools', label: 'Tools', icon: Settings }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`px-4 py-3 flex items-center space-x-2 ${
              selectedTab === tab.id 
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Main Content */}
      <div className="p-4 max-h-[70vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {selectedTab === 'state' && renderStateTab()}
            {selectedTab === 'memory' && renderMemoryTab()}
            {selectedTab === 'conversation' && renderConversationTab()}
            {selectedTab === 'logs' && renderLogsTab()}
            {selectedTab === 'tools' && renderToolsTab()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Console Output */}
      <div className="bg-gray-800 p-4 border-t border-white/10">
        <div className="bg-black/50 rounded-lg p-3 h-40 overflow-y-auto font-mono text-sm">
          {consoleOutput.map((line, i) => (
            <div key={i} className={`mb-1 ${
              line.startsWith('>') ? 'text-green-400' : 
              line.startsWith('Error') ? 'text-red-400' : 
              'text-white'
            }`}>
              {line}
            </div>
          ))}
          {consoleOutput.length === 0 && (
            <div className="text-gray-500">
              # Agent debug console - run commands to see output here
            </div>
          )}
        </div>
      </div>
    </div>
  );
};