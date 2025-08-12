import { Schedule, ScheduleResponse } from './schedule.types';
import logger from '../../common/utils/logger';

export class ScheduleService {
  // Mock data matching OpenAPI examples
  private mockSchedules: Schedule[] = [
    {
      id: 'sched_001',
      date: '2024-03-15',
      time: '09:00:00',
      available: true,
      maxCapacity: 20,
      currentEnrollment: 15,
    },
    {
      id: 'sched_002',
      date: '2024-03-15',
      time: '14:00:00',
      available: true,
      maxCapacity: 20,
      currentEnrollment: 8,
    },
    {
      id: 'sched_003',
      date: '2024-03-16',
      time: '10:00:00',
      available: true,
      maxCapacity: 25,
      currentEnrollment: 12,
    },
    {
      id: 'sched_004',
      date: '2024-03-16',
      time: '15:00:00',
      available: true,
      maxCapacity: 25,
      currentEnrollment: 18,
    },
    {
      id: 'sched_005',
      date: '2024-03-17',
      time: '08:00:00',
      available: true,
      maxCapacity: 30,
      currentEnrollment: 22,
    },
    {
      id: 'sched_006',
      date: '2024-03-17',
      time: '13:00:00',
      available: true,
      maxCapacity: 30,
      currentEnrollment: 25,
    },
    {
      id: 'sched_007',
      date: '2024-03-18',
      time: '11:00:00',
      available: true,
      maxCapacity: 20,
      currentEnrollment: 8,
    },
    {
      id: 'sched_008',
      date: '2024-03-18',
      time: '16:00:00',
      available: true,
      maxCapacity: 20,
      currentEnrollment: 14,
    },
    {
      id: 'sched_009',
      date: '2024-03-19',
      time: '09:30:00',
      available: true,
      maxCapacity: 15,
      currentEnrollment: 11,
    },
    {
      id: 'sched_010',
      date: '2024-03-19',
      time: '14:30:00',
      available: true,
      maxCapacity: 15,
      currentEnrollment: 7,
    },
  ];

  /**
   * Get available schedules with optional filters
   */
  async getAvailableSchedules(date?: string, limit?: number): Promise<ScheduleResponse> {
    try {
      let schedules = [...this.mockSchedules];

      // Filter by date if provided
      if (date) {
        schedules = schedules.filter((schedule) => schedule.date === date);
      }

      // Filter only available schedules
      schedules = schedules.filter((schedule) => schedule.available);

      // Apply limit if provided
      if (limit && limit > 0) {
        schedules = schedules.slice(0, limit);
      }

      logger.info(
        {
          count: schedules.length,
          filters: { date, limit },
        },
        'Retrieved available schedules'
      );

      return {
        success: true,
        schedules,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get available schedules');
      throw new Error('Failed to retrieve schedules');
    }
  }

  /**
   * Check if a specific schedule is available
   */
  async isScheduleAvailable(scheduleDateTime: string): Promise<boolean> {
    try {
      // Parse the datetime to date and time
      const dateObj = new Date(scheduleDateTime);
      const date = dateObj.toISOString().split('T')[0];
      const time = dateObj.toTimeString().split(' ')[0];

      const schedule = this.mockSchedules.find((s) => s.date === date && s.time === time);

      return schedule ? schedule.available : false;
    } catch (error) {
      logger.error({ error }, 'Failed to check schedule availability');
      return false;
    }
  }

  /**
   * Update enrollment count for a schedule
   * This would be called when a registration is created
   */
  async updateEnrollment(scheduleId: string, increment: boolean = true): Promise<void> {
    try {
      const schedule = this.mockSchedules.find((s) => s.id === scheduleId);

      if (schedule) {
        if (increment) {
          schedule.currentEnrollment++;
          // Check if we reached capacity
          if (schedule.currentEnrollment >= schedule.maxCapacity) {
            schedule.available = false;
          }
        } else {
          schedule.currentEnrollment = Math.max(0, schedule.currentEnrollment - 1);
          // Re-enable if below capacity
          if (schedule.currentEnrollment < schedule.maxCapacity) {
            schedule.available = true;
          }
        }
      }

      logger.info(
        {
          scheduleId,
          increment,
          currentEnrollment: schedule?.currentEnrollment,
        },
        'Updated schedule enrollment'
      );
    } catch (error) {
      logger.error({ error }, 'Failed to update enrollment');
    }
  }
}

// Export singleton instance
export const scheduleService = new ScheduleService();
