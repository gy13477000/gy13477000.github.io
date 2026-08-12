// 时间戳转换工具

export type TimestampUnit = 's' | 'ms'

export interface TimeConversion {
  unix: number
  unit: TimestampUnit
  localISO: string
  utcISO: string
  gmtString: string
  relative: string
  weekday: string
  year: number
  month: number
  day: number
  hours: number
  minutes: number
  seconds: number
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function nowUnix(unit: TimestampUnit = 's'): number {
  const ms = Date.now()
  return unit === 's' ? Math.floor(ms / 1000) : ms
}

export function parseTimestamp(value: number, unit: TimestampUnit): Date {
  const ms = unit === 's' ? value * 1000 : value
  return new Date(ms)
}

export function describe(date: Date, unit: TimestampUnit): TimeConversion {
  const ms = date.getTime()
  const unix = unit === 's' ? Math.floor(ms / 1000) : ms

  const pad = (n: number) => n.toString().padStart(2, '0')
  const localISO =
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

  const utcISO = date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, 'Z')

  return {
    unix,
    unit,
    localISO,
    utcISO,
    gmtString: date.toUTCString(),
    relative: relativeFromNow(date),
    weekday: WEEKDAYS[date.getDay()],
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds()
  }
}

export function relativeFromNow(date: Date): string {
  const diffMs = date.getTime() - Date.now()
  const past = diffMs < 0
  const abs = Math.abs(diffMs)
  const sec = Math.floor(abs / 1000)
  const min = Math.floor(sec / 60)
  const hour = Math.floor(min / 60)
  const day = Math.floor(hour / 24)

  let desc: string
  if (sec < 10) desc = '刚刚'
  else if (sec < 60) desc = `${sec} 秒`
  else if (min < 60) desc = `${min} 分钟`
  else if (hour < 24) desc = `${hour} 小时`
  else if (day < 30) desc = `${day} 天`
  else if (day < 365) desc = `${Math.floor(day / 30)} 个月`
  else desc = `${Math.floor(day / 365)} 年`

  if (desc === '刚刚') return desc
  return past ? `${desc}前` : `${desc}后`
}

// 字符串 → Date 解析（支持 yyyy-MM-dd HH:mm:ss 等格式）
export function parseLocalDateTime(input: string): Date | null {
  if (!input) return null
  // 直接交给 Date.parse
  const normalized = input.replace(/-/g, '/').replace('T', ' ')
  const t = new Date(normalized).getTime()
  if (Number.isNaN(t)) return null
  return new Date(t)
}

export function toUnix(date: Date, unit: TimestampUnit): number {
  return unit === 's' ? Math.floor(date.getTime() / 1000) : date.getTime()
}