import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

/**
 * Service for managing event-based triggers
 */
class EventService {
  private supabase: any;
  private eventListeners: Map<string, Function[]> = new Map();
  private isConnected: boolean = false;
  private apiBaseUrl: string;
  
  constructor() {
    // Initialize with environment variables
    const supabaseUrl = process.env.SUPABASE_URL as string;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    // Initialize Supabase if credentials are available
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your_')) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.initializeRealtime();
      console.log('✅ Event service initialized with Supabase Realtime');
    } else {
      console.log('⚠️ Supabase Realtime not configured - using in-memory event system');
    }
  }
  
  /**
   * Initialize realtime connections
   */
  private async initializeRealtime() {
    if (!this.supabase) return;
    
    try {
      // Set up channel for guild events
      const channel = this.supabase.channel('guild-events');
      
      // Subscribe to inserts on guilds table
      channel
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'guilds' },
          (payload: any) => this.handleDatabaseEvent('guild.created', payload)
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'guilds' },
          (payload: any) => this.handleDatabaseEvent('guild.updated', payload)
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            console.log('✅ Connected to Supabase Realtime for guild events');
          }
        });
        
      // Set up channel for agent events  
      const agentChannel = this.supabase.channel('agent-events');
      
      // Subscribe to changes on agents table
      agentChannel
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'agents' },
          (payload: any) => this.handleDatabaseEvent('agent.changed', payload)
        )
        .subscribe();
        
      // Set up channel for workflow events
      const workflowChannel = this.supabase.channel('workflow-events');
      
      // Subscribe to changes on workflows table  
      workflowChannel
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'workflows' },
          (payload: any) => this.handleDatabaseEvent('workflow.changed', payload)
        )
        .subscribe();
    } catch (error) {
      console.error('❌ Failed to initialize Supabase Realtime:', error);
      this.isConnected = false;
    }
  }
  
  /**
   * Handle database events from Supabase
   */
  private handleDatabaseEvent(eventType: string, payload: any) {
    const event = {
      id: uuidv4(),
      type: eventType,
      timestamp: new Date().toISOString(),
      payload: payload.new || payload,
      source: 'database'
    };
    
    // Emit the event to any listeners
    this.emit(eventType, event);
    
    // Also emit a generic event for all database changes
    this.emit('database.changed', event);
    
    console.log(`📝 Database event: ${eventType}`);
  }
  
  /**
   * Emit an event to all registered listeners
   */
  public emit(eventType: string, eventData: any) {
    const listeners = this.eventListeners.get(eventType) || [];
    
    for (const listener of listeners) {
      try {
        listener(eventData);
      } catch (error) {
        console.error(`❌ Error in event listener for ${eventType}:`, error);
      }
    }
  }
  
  /**
   * Register a listener for an event type
   */
  public on(eventType: string, listener: Function): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    this.eventListeners.get(eventType)!.push(listener);
    
    // Return function to unregister this listener
    return () => {
      const listeners = this.eventListeners.get(eventType) || [];
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
        this.eventListeners.set(eventType, listeners);
      }
    };
  }
  
  /**
   * Register a workflow to be triggered by an event
   */
  public async registerEventTrigger(
    workflowId: string,
    eventType: string,
    filter: Record<string, any> = {}
  ): Promise<{ id: string; success: boolean }> {
    try {
      console.log(`🔄 Registering event trigger for workflow ${workflowId} on event ${eventType}`);
      
      // If we have Supabase, store in database
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('workflow_triggers')
          .insert({
            workflow_id: workflowId,
            type: 'event',
            config: {
              event_type: eventType,
              filter
            },
            status: 'active'
          })
          .select()
          .single();
          
        if (error) {
          console.error('❌ Failed to register event trigger in database:', error);
          throw error;
        }
        
        return {
          id: data.id,
          success: true
        };
      }
      
      // If no database, just store in memory and return a mock ID
      const triggerId = `event-trigger-${uuidv4()}`;
      
      // Set up the event listener that will trigger the workflow
      this.on(eventType, async (event: any) => {
        // Check if the event matches the filter
        if (this.matchesFilter(event, filter)) {
          try {
            // Call the workflow execution API
            await axios.post(`${this.apiBaseUrl}/api/workflow/execute`, {
              workflow_id: workflowId,
              trigger: {
                type: 'event',
                event
              }
            });
            
            console.log(`✅ Workflow ${workflowId} triggered by event ${eventType}`);
          } catch (error) {
            console.error(`❌ Failed to execute workflow ${workflowId} for event ${eventType}:`, error);
          }
        }
      });
      
      return {
        id: triggerId,
        success: true
      };
    } catch (error) {
      console.error('❌ Failed to register event trigger:', error);
      return {
        id: '',
        success: false
      };
    }
  }
  
  /**
   * Check if an event matches a filter
   */
  private matchesFilter(event: any, filter: Record<string, any>): boolean {
    // If no filter, match everything
    if (!filter || Object.keys(filter).length === 0) {
      return true;
    }
    
    // Check each filter condition
    for (const [key, value] of Object.entries(filter)) {
      const keyParts = key.split('.');
      let eventValue = event;
      
      // Traverse nested properties
      for (const part of keyParts) {
        if (eventValue && typeof eventValue === 'object' && part in eventValue) {
          eventValue = eventValue[part];
        } else {
          return false; // Property path doesn't exist
        }
      }
      
      // Check if the value matches
      if (eventValue !== value) {
        return false;
      }
    }
    
    // All conditions matched
    return true;
  }
  
  /**
   * Get all event triggers for a workflow
   */
  public async getWorkflowEventTriggers(workflowId: string): Promise<any[]> {
    try {
      if (!this.supabase) {
        return [];
      }
      
      const { data, error } = await this.supabase
        .from('workflow_triggers')
        .select('*')
        .eq('workflow_id', workflowId)
        .eq('type', 'event');
        
      if (error) {
        console.error('❌ Failed to get event triggers:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Error getting event triggers:', error);
      return [];
    }
  }
  
  /**
   * Delete an event trigger
   */
  public async deleteEventTrigger(triggerId: string): Promise<boolean> {
    try {
      if (!this.supabase) {
        return false;
      }
      
      const { error } = await this.supabase
        .from('workflow_triggers')
        .delete()
        .eq('id', triggerId);
        
      if (error) {
        console.error('❌ Failed to delete event trigger:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error deleting event trigger:', error);
      return false;
    }
  }
  
  /**
   * Get connection status
   */
  public isRealtimeConnected(): boolean {
    return this.isConnected;
  }
}

// Create singleton instance
const eventService = new EventService();

export default eventService;