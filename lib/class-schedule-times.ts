/** Admin dars rejasi — POST, PUT, import bir xil ro'yxat */
export const CLASS_SCHEDULE_VALID_TIMES = [
  '05:30',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '12:00',
  '13:00',
  '14:00',
  '14:30',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
] as const

export type ClassScheduleTime = (typeof CLASS_SCHEDULE_VALID_TIMES)[number]

export function isValidClassScheduleTime(time: string): boolean {
  return (CLASS_SCHEDULE_VALID_TIMES as readonly string[]).includes(time)
}
