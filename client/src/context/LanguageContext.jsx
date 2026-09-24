import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const LANGUAGE_KEY = 'northstarLanguage'
const messages = {
  en: {
    home: 'Home', memories: 'Memories', planner: 'Planner', language: 'ภาษาไทย',
    specialDate: 'OUR SPECIAL DATE', together: 'Together, every day.', nextCelebration: 'Our next little celebration.', startCountdown: 'Start your countdown.',
    daysTogether: 'days together', hoursTogether: 'hours together', minutesTogether: 'minutes together', daysUntil: 'days until your day', hoursUntil: 'hours until your day', minutesUntil: 'minutes until your day',
    since: 'Since', on: 'On', days: 'days', hours: 'hours', minutes: 'minutes', editDate: 'Edit date', addDate: 'Add your special date to begin.', saveDate: 'Save date', cancel: 'Cancel', removeDate: 'Remove date', validDate: 'Choose a valid date between 1900 and 2100.',
    today: 'Today', previousMonth: 'Previous month', nextMonth: 'Next month', noPlans: 'No plans yet', dayStreak: 'day streak', checkedIn: 'Checked in', checkInTogether: 'Check in together', you: 'You',
    timeline: 'Timeline', grid: 'Grid', memoryArchive: 'Memory archive', saveMemory: 'Save memory', whatHappened: 'What happened?',
    login: 'Sign in', signup: 'Create account', email: 'Email address', password: 'Password', confirmPassword: 'Confirm password', enterWorkspace: 'Enter workspace', createAccount: 'Create account',
  },
  th: {
    home: 'หน้าหลัก', memories: 'ความทรงจำ', planner: 'แพลน', language: 'English',
    specialDate: 'วันพิเศษของเรา', together: 'อยู่ด้วยกันในทุกวัน', nextCelebration: 'การฉลองครั้งต่อไปของเรา', startCountdown: 'เริ่มนับถอยหลัง',
    daysTogether: 'วันที่อยู่ด้วยกัน', hoursTogether: 'ชั่วโมงที่อยู่ด้วยกัน', minutesTogether: 'นาทีที่อยู่ด้วยกัน', daysUntil: 'วันก่อนถึงวันพิเศษ', hoursUntil: 'ชั่วโมงก่อนถึงวันพิเศษ', minutesUntil: 'นาทีก่อนถึงวันพิเศษ',
    since: 'ตั้งแต่', on: 'วันที่', days: 'วัน', hours: 'ชั่วโมง', minutes: 'นาที', editDate: 'แก้ไขวันที่', addDate: 'เพิ่มวันพิเศษเพื่อเริ่มต้น', saveDate: 'บันทึกวันที่', cancel: 'ยกเลิก', removeDate: 'ลบวันที่', validDate: 'กรุณาเลือกวันที่ระหว่างปี 1900 ถึง 2100',
    today: 'วันนี้', previousMonth: 'เดือนก่อน', nextMonth: 'เดือนถัดไป', noPlans: 'ยังไม่มีแผน', dayStreak: 'วันต่อเนื่อง', checkedIn: 'เช็กอินแล้ว', checkInTogether: 'เช็กอินด้วยกัน', you: 'คุณ',
    timeline: 'ไทม์ไลน์', grid: 'ตาราง', memoryArchive: 'บันทึกความทรงจำ', saveMemory: 'บันทึกความทรงจำ', whatHappened: 'เกิดอะไรขึ้น?',
    login: 'เข้าสู่ระบบ', signup: 'สร้างบัญชี', email: 'อีเมล', password: 'รหัสผ่าน', confirmPassword: 'ยืนยันรหัสผ่าน', enterWorkspace: 'เข้าสู่พื้นที่ของเรา', createAccount: 'สร้างบัญชี',
  },
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || 'en')
  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language)
    document.documentElement.lang = language === 'th' ? 'th' : 'en'
    document.documentElement.dataset.language = language
  }, [language])
  const value = useMemo(() => ({ language, setLanguage, t: (key) => messages[language][key] || messages.en[key] || key }), [language])
  return <LanguageContext.Provider value={value}>{children}<button className="global-language-button" type="button" onClick={() => setLanguage(language === 'th' ? 'en' : 'th')} aria-label={language === 'th' ? 'Change language to English' : 'เปลี่ยนภาษาเป็นไทย'}>{messages[language].language}</button></LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
