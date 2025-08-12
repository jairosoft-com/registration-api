export interface Schedule {
  id: string;
  date: string;
  time: string;
  available: boolean;
  maxCapacity: number;
  currentEnrollment: number;
}

export interface ScheduleResponse {
  success: boolean;
  schedules: Schedule[];
}
