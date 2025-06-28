import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Globe, 
  Zap, 
  Calendar, 
  Info, 
  Plus, 
  Save,
  Play,
  Trash2,
  RefreshCw,
  Settings
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { HolographicButton } from './HolographicButton';
import { workflowEngineService, ScheduleConfig, WebhookConfig, EventTriggerConfig } from '../../services/workflowEngineService';

interface TriggerSystemBuilderProps {
  workflowId: string;
  onSave?: (triggerId: string, triggerType: string) => void;
  className?: string;
}

export const TriggerSystemBuilder: React.FC<TriggerSystemBuilderProps> = ({
  workflowId,
  onSave,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'webhook' | 'event'>('schedule');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Schedule configuration state
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    frequency: 'daily',
    time: '09:00',
    timezone: 'UTC',
    daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
    daysOfMonth: []
  });
  
  // Webhook configuration state
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({
    method: 'POST',
    path: `/webhook/${workflowId}`,
    secret: generateRandomSecret(),
    requireSignature: true
  });
  
  // Event configuration state
  const [eventConfig, setEventConfig] = useState<EventTriggerConfig>({
    eventType: 'data_updated',
    filter: { entity: 'users' }
  });
  
  // Handle schedule configuration changes
  const handleScheduleChange = (field: keyof ScheduleConfig, value: any) => {
    setScheduleConfig(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Handle special case for frequency changes
    if (field === 'frequency') {
      // Reset related fields based on frequency type
      if (value === 'daily' || value === 'hourly' || value === 'minutely') {
        setScheduleConfig(prev => ({
          ...prev,
          daysOfWeek: [],
          daysOfMonth: []
        }));
      } else if (value === 'weekly') {
        setScheduleConfig(prev => ({
          ...prev,
          daysOfWeek: [1], // Monday
          daysOfMonth: []
        }));
      } else if (value === 'monthly') {
        setScheduleConfig(prev => ({
          ...prev,
          daysOfWeek: [],
          daysOfMonth: [1] // 1st of month
        }));
      }
    }
  };
  
  // Handle day of week toggle
  const toggleDayOfWeek = (day: number) => {
    setScheduleConfig(prev => {
      const currentDays = [...(prev.daysOfWeek || [])];
      const index = currentDays.indexOf(day);
      
      if (index >= 0) {
        currentDays.splice(index, 1);
      } else {
        currentDays.push(day);
        currentDays.sort();
      }
      
      return {
        ...prev,
        daysOfWeek: currentDays
      };
    });
  };
  
  // Handle day of month toggle
  const toggleDayOfMonth = (day: number) => {
    setScheduleConfig(prev => {
      const currentDays = [...(prev.daysOfMonth || [])];
      const index = currentDays.indexOf(day);
      
      if (index >= 0) {
        currentDays.splice(index, 1);
      } else {
        currentDays.push(day);
        currentDays.sort((a, b) => a - b);
      }
      
      return {
        ...prev,
        daysOfMonth: currentDays
      };
    });
  };
  
  // Save trigger configuration
  const saveTrigger = async () => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      let result;
      
      switch (activeTab) {
        case 'schedule':
          result = await workflowEngineService.createTriggerSchedule(workflowId, scheduleConfig);
          break;
        case 'webhook':
          result = await workflowEngineService.registerWebhookTrigger(workflowId, webhookConfig);
          break;
        case 'event':
          result = await workflowEngineService.registerEventTrigger(workflowId, eventConfig);
          break;
      }
      
      if (result && result.id) {
        setSuccessMessage(`${activeTab} trigger created successfully!`);
        if (onSave) {
          onSave(result.id, activeTab);
        }
      } else {
        setErrorMessage(`Failed to create ${activeTab} trigger.`);
      }
    } catch (error: any) {
      console.error(`Failed to create ${activeTab} trigger:`, error);
      setErrorMessage(error.message || `Failed to create ${activeTab} trigger.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate a random webhook secret
  function generateRandomSecret(length = 24) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  return (
    <GlassCard variant="medium" className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Trigger System</h2>
            <p className="text-gray-300">Configure how your workflow gets activated</p>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex mb-6 bg-white/5 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center px-4 py-2 rounded-md ${
            activeTab === 'schedule'
              ? 'bg-blue-500/20 text-blue-300'
              : 'text-gray-300 hover:bg-white/10'
          }`}
        >
          <Clock className="w-4 h-4 mr-2" />
          Schedule
        </button>
        <button
          onClick={() => setActiveTab('webhook')}
          className={`flex items-center px-4 py-2 rounded-md ${
            activeTab === 'webhook'
              ? 'bg-green-500/20 text-green-300'
              : 'text-gray-300 hover:bg-white/10'
          }`}
        >
          <Globe className="w-4 h-4 mr-2" />
          Webhook
        </button>
        <button
          onClick={() => setActiveTab('event')}
          className={`flex items-center px-4 py-2 rounded-md ${
            activeTab === 'event'
              ? 'bg-purple-500/20 text-purple-300'
              : 'text-gray-300 hover:bg-white/10'
          }`}
        >
          <Zap className="w-4 h-4 mr-2" />
          Event
        </button>
      </div>
      
      {/* Schedule Configuration */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div>
            <label className="text-white text-sm mb-2 block">Frequency</label>
            <select
              value={scheduleConfig.frequency}
              onChange={(e) => handleScheduleChange('frequency', e.target.value)}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="minutely">Every Minute</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom (Advanced)</option>
            </select>
          </div>
          
          {(scheduleConfig.frequency === 'daily' ||
           scheduleConfig.frequency === 'weekly' ||
           scheduleConfig.frequency === 'monthly') && (
            <div>
              <label className="text-white text-sm mb-2 block">Time</label>
              <input
                type="time"
                value={scheduleConfig.time || '09:00'}
                onChange={(e) => handleScheduleChange('time', e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
          )}
          
          {scheduleConfig.frequency === 'weekly' && (
            <div>
              <label className="text-white text-sm mb-2 block">Days of Week</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { day: 0, label: 'Sun' },
                  { day: 1, label: 'Mon' },
                  { day: 2, label: 'Tue' },
                  { day: 3, label: 'Wed' },
                  { day: 4, label: 'Thu' },
                  { day: 5, label: 'Fri' },
                  { day: 6, label: 'Sat' }
                ].map(({ day, label }) => (
                  <button
                    key={day}
                    onClick={() => toggleDayOfWeek(day)}
                    className={`w-12 h-12 rounded-lg ${
                      (scheduleConfig.daysOfWeek || []).includes(day)
                        ? 'bg-blue-500/40 border-blue-500/80 text-blue-300'
                        : 'bg-white/5 border-white/20 text-gray-300'
                    } border hover:bg-white/10`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {scheduleConfig.frequency === 'monthly' && (
            <div>
              <label className="text-white text-sm mb-2 block">Days of Month</label>
              <div className="flex flex-wrap gap-2">
                {[1, 5, 10, 15, 20, 25, 'L'].map((day) => (
                  <button
                    key={day}
                    onClick={() => typeof day === 'number' && toggleDayOfMonth(day)}
                    className={`w-12 h-12 rounded-lg ${
                      typeof day === 'number' && (scheduleConfig.daysOfMonth || []).includes(day)
                        ? 'bg-blue-500/40 border-blue-500/80 text-blue-300'
                        : 'bg-white/5 border-white/20 text-gray-300'
                    } border hover:bg-white/10`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Select specific days of the month or 'L' for last day</p>
            </div>
          )}
          
          {scheduleConfig.frequency === 'custom' && (
            <div>
              <label className="text-white text-sm mb-2 block">Cron Expression</label>
              <input
                type="text"
                value={scheduleConfig.cronExpression || '0 9 * * 1-5'}
                onChange={(e) => setScheduleConfig(prev => ({
                  ...prev,
                  cronExpression: e.target.value
                }))}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white font-mono"
                placeholder="0 9 * * 1-5"
              />
              <p className="text-xs text-gray-400 mt-2">
                Format: minute hour day-of-month month day-of-week
              </p>
            </div>
          )}
          
          <div>
            <label className="text-white text-sm mb-2 block">Timezone</label>
            <select
              value={scheduleConfig.timezone || 'UTC'}
              onChange={(e) => handleScheduleChange('timezone', e.target.value)}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Central European Time (CET)</option>
              <option value="Asia/Tokyo">Japan (JST)</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Webhook Configuration */}
      {activeTab === 'webhook' && (
        <div className="space-y-4">
          <div>
            <label className="text-white text-sm mb-2 block">HTTP Method</label>
            <select
              value={webhookConfig.method || 'POST'}
              onChange={(e) => setWebhookConfig(prev => ({
                ...prev,
                method: e.target.value as any
              }))}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          
          <div>
            <label className="text-white text-sm mb-2 block">Webhook Path</label>
            <input
              type="text"
              value={webhookConfig.path || `/webhook/${workflowId}`}
              onChange={(e) => setWebhookConfig(prev => ({
                ...prev,
                path: e.target.value
              }))}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
              placeholder="/webhook/my-workflow"
            />
            <p className="text-xs text-gray-400 mt-1">
              This will be appended to your API base URL
            </p>
          </div>
          
          <div>
            <label className="text-white text-sm mb-2 block">Secret Key</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={webhookConfig.secret || ''}
                onChange={(e) => setWebhookConfig(prev => ({
                  ...prev,
                  secret: e.target.value
                }))}
                className="flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white font-mono"
              />
              <HolographicButton
                variant="ghost"
                onClick={() => setWebhookConfig(prev => ({
                  ...prev,
                  secret: generateRandomSecret()
                }))}
                className="whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate
              </HolographicButton>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Used to verify webhook requests are authentic
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requireSignature"
              checked={webhookConfig.requireSignature !== false}
              onChange={(e) => setWebhookConfig(prev => ({
                ...prev,
                requireSignature: e.target.checked
              }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="requireSignature" className="text-white">
              Require signature verification
            </label>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <h4 className="text-white font-medium flex items-center mb-2">
              <Info className="w-4 h-4 text-blue-400 mr-2" />
              Webhook Information
            </h4>
            <p className="text-sm text-gray-300 mb-3">
              Your webhook will be available at:
            </p>
            <div className="bg-black/30 p-3 rounded font-mono text-green-400 text-sm break-all">
              https://api.yourdomain.com{webhookConfig.path || `/webhook/${workflowId}`}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Include the secret in your webhook request's <code>X-Webhook-Signature</code> header
            </p>
          </div>
        </div>
      )}
      
      {/* Event Configuration */}
      {activeTab === 'event' && (
        <div className="space-y-4">
          <div>
            <label className="text-white text-sm mb-2 block">Event Type</label>
            <select
              value={eventConfig.eventType}
              onChange={(e) => setEventConfig(prev => ({
                ...prev,
                eventType: e.target.value
              }))}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="data_updated">Data Updated</option>
              <option value="user_action">User Action</option>
              <option value="system_event">System Event</option>
              <option value="agent_message">Agent Message</option>
              <option value="workflow_completed">Workflow Completed</option>
              <option value="api_callback">API Callback</option>
            </select>
          </div>
          
          <div>
            <label className="text-white text-sm mb-2 block">Filter Criteria</label>
            <div className="space-y-2">
              {/* Entity filter for data_updated */}
              {eventConfig.eventType === 'data_updated' && (
                <div>
                  <label className="text-gray-300 text-xs mb-1 block">Entity</label>
                  <select
                    value={(eventConfig.filter as any)?.entity || ''}
                    onChange={(e) => setEventConfig(prev => ({
                      ...prev,
                      filter: { ...prev.filter, entity: e.target.value }
                    }))}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="users">Users</option>
                    <option value="guilds">Guilds</option>
                    <option value="agents">Agents</option>
                    <option value="workflows">Workflows</option>
                  </select>
                </div>
              )}
              
              {/* Action type for user_action */}
              {eventConfig.eventType === 'user_action' && (
                <div>
                  <label className="text-gray-300 text-xs mb-1 block">Action Type</label>
                  <select
                    value={(eventConfig.filter as any)?.action || ''}
                    onChange={(e) => setEventConfig(prev => ({
                      ...prev,
                      filter: { ...prev.filter, action: e.target.value }
                    }))}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                  </select>
                </div>
              )}
              
              {/* Source for system_event */}
              {eventConfig.eventType === 'system_event' && (
                <div>
                  <label className="text-gray-300 text-xs mb-1 block">Source</label>
                  <select
                    value={(eventConfig.filter as any)?.source || ''}
                    onChange={(e) => setEventConfig(prev => ({
                      ...prev,
                      filter: { ...prev.filter, source: e.target.value }
                    }))}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="database">Database</option>
                    <option value="auth">Authentication</option>
                    <option value="storage">Storage</option>
                    <option value="scheduler">Scheduler</option>
                  </select>
                </div>
              )}
              
              {/* Agent ID for agent_message */}
              {eventConfig.eventType === 'agent_message' && (
                <div>
                  <label className="text-gray-300 text-xs mb-1 block">Agent ID (optional)</label>
                  <input
                    type="text"
                    value={(eventConfig.filter as any)?.agent_id || ''}
                    onChange={(e) => setEventConfig(prev => ({
                      ...prev,
                      filter: { ...prev.filter, agent_id: e.target.value }
                    }))}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="Leave blank to listen to all agents"
                  />
                </div>
              )}
              
              {/* Workflow ID for workflow_completed */}
              {eventConfig.eventType === 'workflow_completed' && (
                <div>
                  <label className="text-gray-300 text-xs mb-1 block">Workflow ID (optional)</label>
                  <input
                    type="text"
                    value={(eventConfig.filter as any)?.workflow_id || ''}
                    onChange={(e) => setEventConfig(prev => ({
                      ...prev,
                      filter: { ...prev.filter, workflow_id: e.target.value }
                    }))}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="Leave blank to listen to all workflows"
                  />
                </div>
              )}
              
              {/* Endpoint for api_callback */}
              {eventConfig.eventType === 'api_callback' && (
                <div>
                  <label className="text-gray-300 text-xs mb-1 block">API Endpoint</label>
                  <input
                    type="text"
                    value={(eventConfig.filter as any)?.endpoint || ''}
                    onChange={(e) => setEventConfig(prev => ({
                      ...prev,
                      filter: { ...prev.filter, endpoint: e.target.value }
                    }))}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="/api/callback"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <h4 className="text-white font-medium flex items-center mb-2">
              <Info className="w-4 h-4 text-purple-400 mr-2" />
              Event Trigger Information
            </h4>
            <p className="text-sm text-gray-300">
              This workflow will be automatically triggered when the selected event occurs. Events are processed in real-time through the system's event bus.
            </p>
            <div className="flex items-center mt-3 text-purple-300 text-sm">
              <Zap className="w-4 h-4 mr-2" />
              <span>Event-driven automation with intelligent routing</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mt-4 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
          <p className="text-green-300 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            {successMessage}
          </p>
        </div>
      )}
      
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
          <p className="text-red-300 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {errorMessage}
          </p>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-3">
        <HolographicButton
          variant="outline"
          onClick={() => {
            // Reset form based on active tab
            switch (activeTab) {
              case 'schedule':
                setScheduleConfig({
                  frequency: 'daily',
                  time: '09:00',
                  timezone: 'UTC',
                  daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
                  daysOfMonth: []
                });
                break;
              case 'webhook':
                setWebhookConfig({
                  method: 'POST',
                  path: `/webhook/${workflowId}`,
                  secret: generateRandomSecret(),
                  requireSignature: true
                });
                break;
              case 'event':
                setEventConfig({
                  eventType: 'data_updated',
                  filter: { entity: 'users' }
                });
                break;
            }
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </HolographicButton>
        
        <HolographicButton
          onClick={saveTrigger}
          glow
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Trigger
            </>
          )}
        </HolographicButton>
      </div>
    </GlassCard>
  );
};

// Imported from your code to fix TypeScript error
function CheckCircle(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

// Imported from your code to fix TypeScript error
function AlertCircle(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}