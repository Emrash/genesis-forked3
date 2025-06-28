import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as cronParser from 'cron-parser';

/**
 * Service for managing scheduled workflow triggers
 */
class SchedulerService {
  private schedules: Map<string, ScheduleInfo> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private supabase: any;
  private isInitialized: boolean = false;
  private apiBaseUrl: string;
  
  constructor() {
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    // Initialize Supabase if credentials are available
    const supabaseUrl = process.env.SUPABASE_URL as string;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your_')) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Scheduler service initialized with Supabase');
    } else {
      console.log('⚠️ Supabase not configured for scheduler service - using in-memory scheduling');
    }
    
    // Initialize scheduler
    this.initialize();
  }
  
  /**
   * Initialize the scheduler
   */
  private async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Load existing schedules from database if available
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('workflow_triggers')
          .select('*')
          .eq('type', 'schedule')
          .eq('status', 'active');
          
        if (error) {
          console.error('❌ Failed to load schedules from database:', error);
        } else if (data) {
          console.log(`🔄 Loading ${data.length} schedules from database`);
          
          // Set up each schedule
          for (const trigger of data) {
            try {
              const scheduleConfig = trigger.config || {};
              const schedule = this.createScheduleFromConfig(trigger.id, trigger.workflow_id, scheduleConfig);
              
              if (schedule) {
                this.schedules.set(trigger.id, schedule);
                this.setupSchedule(trigger.id, schedule);
              }
            } catch (scheduleError) {
              console.error(`❌ Failed to initialize schedule ${trigger.id}:`, scheduleError);
            }
          }
        }
      }
      
      this.isInitialized = true;
      console.log('✅ Scheduler initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize scheduler:', error);
    }
  }
  
  /**
   * Create a schedule object from config
   */
  private createScheduleFromConfig(
    id: string, 
    workflowId: string, 
    config: any
  ): ScheduleInfo | null {
    try {
      // Handle different frequency types
      let expression: string;
      
      switch (config.frequency) {
        case 'minutely':
          expression = '* * * * *'; // Every minute
          break;
        case 'hourly':
          expression = '0 * * * *'; // Every hour at minute 0
          break;
        case 'daily':
          // Parse time in format HH:MM
          const timeDaily = config.time || '09:00';
          const [hourDaily, minuteDaily] = timeDaily.split(':').map(Number);
          expression = `${minuteDaily} ${hourDaily} * * *`;
          break;
        case 'weekly':
          // Parse time and day of week
          const timeWeekly = config.time || '09:00';
          const [hourWeekly, minuteWeekly] = timeWeekly.split(':').map(Number);
          const dayOfWeek = config.daysOfWeek?.[0] || 1; // Default to Monday (1)
          expression = `${minuteWeekly} ${hourWeekly} * * ${dayOfWeek}`;
          break;
        case 'monthly':
          // Parse time and day of month
          const timeMonthly = config.time || '09:00';
          const [hourMonthly, minuteMonthly] = timeMonthly.split(':').map(Number);
          const dayOfMonth = config.daysOfMonth?.[0] || 1; // Default to 1st of month
          expression = `${minuteMonthly} ${hourMonthly} ${dayOfMonth} * *`;
          break;
        case 'custom':
          // Use provided cron expression
          expression = config.cronExpression || '0 9 * * 1-5'; // Default: 9 AM on weekdays
          break;
        default:
          throw new Error(`Unknown frequency: ${config.frequency}`);
      }
      
      // Parse the cron expression to validate and get next execution
      const interval = cronParser.parseExpression(expression);
      const nextExecution = interval.next().toDate();
      
      return {
        id,
        workflowId,
        expression,
        timezone: config.timezone || 'UTC',
        nextExecution,
        lastExecution: null,
        config
      };
    } catch (error) {
      console.error(`❌ Failed to create schedule from config:`, error);
      return null;
    }
  }
  
  /**
   * Set up a schedule
   */
  private setupSchedule(id: string, schedule: ScheduleInfo) {
    // Clear any existing interval
    if (this.intervals.has(id)) {
      clearInterval(this.intervals.get(id)!);
      this.intervals.delete(id);
    }
    
    // Calculate initial delay until next execution
    const now = new Date();
    const delay = Math.max(0, schedule.nextExecution.getTime() - now.getTime());
    
    console.log(`🕒 Scheduling ${id} to run in ${Math.round(delay / 1000)} seconds (${schedule.nextExecution.toLocaleString()})`);
    
    // Set up timeout for first execution
    const timeout = setTimeout(() => {
      this.executeSchedule(id);
      
      // Then set up recurring interval based on cron
      try {
        const interval = cronParser.parseExpression(schedule.expression);
        
        // Find next 10 execution times for logging
        const nextExecutions = [];
        let next = interval.next();
        nextExecutions.push(next.toDate());
        
        for (let i = 0; i < 2; i++) {
          next = interval.next();
          nextExecutions.push(next.toDate());
        }
        
        console.log(`🔄 Next executions for ${id}:`, 
          nextExecutions.map(d => d.toLocaleString()).join(', ')
        );
        
        // Set up recurring check every minute
        const intervalId = setInterval(() => {
          const schedule = this.schedules.get(id);
          if (!schedule) {
            clearInterval(intervalId);
            return;
          }
          
          const now = new Date();
          if (now >= schedule.nextExecution) {
            this.executeSchedule(id);
            
            // Update next execution time
            try {
              const interval = cronParser.parseExpression(schedule.expression);
              schedule.nextExecution = interval.next().toDate();
              this.schedules.set(id, schedule);
              
              // Update in database if available
              this.updateScheduleInDatabase(id, schedule);
            } catch (error) {
              console.error(`❌ Failed to update next execution for ${id}:`, error);
            }
          }
        }, 60000); // Check every minute
        
        this.intervals.set(id, intervalId);
      } catch (error) {
        console.error(`❌ Failed to set up recurring interval for ${id}:`, error);
      }
    }, delay);
    
    // Store timeout as interval (for cleanup purposes)
    this.intervals.set(id, timeout);
  }
  
  /**
   * Execute a scheduled workflow
   */
  private async executeSchedule(scheduleId: string) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      console.error(`❌ Schedule ${scheduleId} not found`);
      return;
    }
    
    console.log(`🔄 Executing scheduled workflow ${schedule.workflowId} (${scheduleId})`);
    
    try {
      // Call the workflow execution API
      const response = await axios.post(`${this.apiBaseUrl}/api/workflow/execute`, {
        flowId: schedule.workflowId,
        trigger: {
          type: 'schedule',
          schedule: scheduleId,
          scheduled_time: new Date().toISOString()
        }
      });
      
      // Update last execution time
      schedule.lastExecution = new Date();
      this.schedules.set(scheduleId, schedule);
      
      // Update in database if available
      this.updateScheduleInDatabase(scheduleId, schedule);
      
      console.log(`✅ Scheduled workflow ${schedule.workflowId} executed successfully: ${response.data.executionId}`);
    } catch (error) {
      console.error(`❌ Failed to execute scheduled workflow ${schedule.workflowId}:`, error);
    }
  }
  
  /**
   * Update schedule in database
   */
  private async updateScheduleInDatabase(id: string, schedule: ScheduleInfo) {
    if (!this.supabase) return;
    
    try {
      const { error } = await this.supabase
        .from('workflow_triggers')
        .update({
          config: {
            ...schedule.config,
            nextExecution: schedule.nextExecution.toISOString(),
            lastExecution: schedule.lastExecution ? schedule.lastExecution.toISOString() : null
          },
          updated_at: new Date()
        })
        .eq('id', id);
        
      if (error) {
        console.error(`❌ Failed to update schedule ${id} in database:`, error);
      }
    } catch (error) {
      console.error(`❌ Error updating schedule ${id} in database:`, error);
    }
  }
  
  /**
   * Create a new schedule
   */
  public async createSchedule(
    workflowId: string,
    config: ScheduleConfig
  ): Promise<{ id: string; success: boolean; nextExecution?: Date }> {
    try {
      console.log(`🔄 Creating schedule for workflow ${workflowId}`);
      
      let scheduleId: string;
      
      // If we have Supabase, store in database
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('workflow_triggers')
          .insert({
            workflow_id: workflowId,
            type: 'schedule',
            config,
            status: 'active'
          })
          .select()
          .single();
          
        if (error) {
          console.error('❌ Failed to create schedule in database:', error);
          throw error;
        }
        
        scheduleId = data.id;
      } else {
        // Generate a unique ID
        scheduleId = `schedule-${uuidv4()}`;
      }
      
      // Create schedule object
      const schedule = this.createScheduleFromConfig(scheduleId, workflowId, config);
      
      if (!schedule) {
        throw new Error('Failed to create schedule from config');
      }
      
      // Store and set up the schedule
      this.schedules.set(scheduleId, schedule);
      this.setupSchedule(scheduleId, schedule);
      
      return {
        id: scheduleId,
        success: true,
        nextExecution: schedule.nextExecution
      };
    } catch (error) {
      console.error('❌ Failed to create schedule:', error);
      return {
        id: '',
        success: false
      };
    }
  }
  
  /**
   * Update an existing schedule
   */
  public async updateSchedule(
    scheduleId: string,
    config: Partial<ScheduleConfig>
  ): Promise<{ success: boolean; nextExecution?: Date }> {
    try {
      const existingSchedule = this.schedules.get(scheduleId);
      if (!existingSchedule) {
        throw new Error(`Schedule ${scheduleId} not found`);
      }
      
      // Merge existing config with updates
      const updatedConfig = {
        ...existingSchedule.config,
        ...config
      };
      
      // Create updated schedule
      const updatedSchedule = this.createScheduleFromConfig(
        scheduleId,
        existingSchedule.workflowId,
        updatedConfig
      );
      
      if (!updatedSchedule) {
        throw new Error('Failed to update schedule from config');
      }
      
      // Update in database if available
      if (this.supabase) {
        const { error } = await this.supabase
          .from('workflow_triggers')
          .update({
            config: updatedConfig,
            updated_at: new Date()
          })
          .eq('id', scheduleId);
          
        if (error) {
          console.error(`❌ Failed to update schedule ${scheduleId} in database:`, error);
          throw error;
        }
      }
      
      // Update local schedule
      this.schedules.set(scheduleId, updatedSchedule);
      
      // Restart the schedule
      this.setupSchedule(scheduleId, updatedSchedule);
      
      return {
        success: true,
        nextExecution: updatedSchedule.nextExecution
      };
    } catch (error) {
      console.error(`❌ Failed to update schedule ${scheduleId}:`, error);
      return {
        success: false
      };
    }
  }
  
  /**
   * Delete a schedule
   */
  public async deleteSchedule(scheduleId: string): Promise<boolean> {
    try {
      // Clear any running interval
      if (this.intervals.has(scheduleId)) {
        clearInterval(this.intervals.get(scheduleId)!);
        this.intervals.delete(scheduleId);
      }
      
      // Remove from local storage
      this.schedules.delete(scheduleId);
      
      // Remove from database if available
      if (this.supabase) {
        const { error } = await this.supabase
          .from('workflow_triggers')
          .delete()
          .eq('id', scheduleId);
          
        if (error) {
          console.error(`❌ Failed to delete schedule ${scheduleId} from database:`, error);
          return false;
        }
      }
      
      console.log(`✅ Schedule ${scheduleId} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete schedule ${scheduleId}:`, error);
      return false;
    }
  }
  
  /**
   * Get all schedules for a workflow
   */
  public async getWorkflowSchedules(workflowId: string): Promise<ScheduleInfo[]> {
    try {
      // If we have Supabase, get from database
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('workflow_triggers')
          .select('*')
          .eq('workflow_id', workflowId)
          .eq('type', 'schedule')
          .eq('status', 'active');
          
        if (error) {
          console.error('❌ Failed to get workflow schedules from database:', error);
          throw error;
        }
        
        // Convert to ScheduleInfo objects
        return data.map((trigger: any) => {
          const config = trigger.config || {};
          
          // Parse dates
          let nextExecution: Date;
          let lastExecution: Date | null = null;
          
          try {
            if (config.nextExecution) {
              nextExecution = new Date(config.nextExecution);
            } else {
              // Calculate next execution
              const interval = cronParser.parseExpression(config.cronExpression || '0 9 * * *');
              nextExecution = interval.next().toDate();
            }
            
            if (config.lastExecution) {
              lastExecution = new Date(config.lastExecution);
            }
          } catch (error) {
            console.error(`❌ Failed to parse dates for schedule ${trigger.id}:`, error);
            nextExecution = new Date(Date.now() + 3600000); // Default to 1 hour from now
          }
          
          return {
            id: trigger.id,
            workflowId: trigger.workflow_id,
            expression: config.cronExpression || '0 9 * * *',
            timezone: config.timezone || 'UTC',
            nextExecution,
            lastExecution,
            config
          };
        });
      }
      
      // Otherwise, get from memory
      return Array.from(this.schedules.values())
        .filter(schedule => schedule.workflowId === workflowId);
    } catch (error) {
      console.error(`❌ Failed to get schedules for workflow ${workflowId}:`, error);
      return [];
    }
  }
  
  /**
   * Get a specific schedule
   */
  public getSchedule(scheduleId: string): ScheduleInfo | null {
    return this.schedules.get(scheduleId) || null;
  }
  
  /**
   * Force immediate execution of a schedule
   */
  public async triggerScheduleNow(scheduleId: string): Promise<boolean> {
    try {
      await this.executeSchedule(scheduleId);
      return true;
    } catch (error) {
      console.error(`❌ Failed to trigger schedule ${scheduleId}:`, error);
      return false;
    }
  }
  
  /**
   * Close and clean up
   */
  public async close() {
    // Clear all intervals
    for (const intervalId of this.intervals.values()) {
      clearInterval(intervalId);
    }
    
    this.intervals.clear();
    this.schedules.clear();
    this.isInitialized = false;
    
    console.log('✅ Scheduler service closed');
  }
}

// Create singleton instance
const schedulerService = new SchedulerService();

export default schedulerService;

// Type definitions
export interface ScheduleConfig {
  frequency: 'minutely' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  time?: string; // Format: 'HH:MM'
  timezone?: string;
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  daysOfMonth?: number[]; // 1-31
  cronExpression?: string;
}

export interface ScheduleInfo {
  id: string;
  workflowId: string;
  expression: string;
  timezone: string;
  nextExecution: Date;
  lastExecution: Date | null;
  config: any;
}