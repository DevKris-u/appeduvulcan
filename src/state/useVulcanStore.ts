import { create } from 'zustand';
import { 
  LuckyNumber, Lesson, Exam, Attendance, 
  ClassificationPeriod, SubjectGrades, 
  MessageListItem, MessageDetail, VulcanContext 
} from '../models/VulcanModels';
import { VulcanRepository } from '../api/VulcanRepository';

interface VulcanState {
  context: VulcanContext | null;
  repository: VulcanRepository | null;
  luckyNumber: string;
  dashboardLessons: Lesson[];
  dashboardExams: Exam[];
  attendancePercent: number;
  fullTimetable: Record<string, Lesson[]>;
  classificationPeriods: ClassificationPeriod[];
  selectedPeriodId: number | null;
  grades: SubjectGrades[];
  messages: MessageListItem[];
  selectedMessage: MessageDetail | null;
  isLoading: boolean;
  error: string | null;

  setContext: (context: VulcanContext) => void;
  loadDashboardData: () => Promise<void>;
  loadFullTimetable: () => Promise<void>;
  loadClassificationPeriods: () => Promise<void>;
  selectPeriod: (id: number) => Promise<void>;
  loadMessages: () => Promise<void>;
  loadMessageDetails: (key: string) => Promise<void>;
  clearSelectedMessage: () => void;
  logout: () => void;
}

export const useVulcanStore = create<VulcanState>((set, get) => ({
  context: null,
  repository: null,
  luckyNumber: '-',
  dashboardLessons: [],
  dashboardExams: [],
  attendancePercent: 0,
  fullTimetable: {},
  classificationPeriods: [],
  selectedPeriodId: null,
  grades: [],
  messages: [],
  selectedMessage: null,
  isLoading: false,
  error: null,

  setContext: (context: VulcanContext) => {
    set({ 
      context, 
      repository: new VulcanRepository(context) 
    });
  },

  loadDashboardData: async () => {
    const { repository } = get();
    if (!repository) return;
    set({ isLoading: true, error: null });
    try {
      const [lucky, lessons, exams, attendance] = await Promise.all([
        repository.getLuckyNumber(),
        repository.getDashboardTimetable(),
        repository.getDashboardExams(),
        repository.getDashboardAttendance()
      ]);

      const attItems = attendance.oddzialy || [];
      const obecnosci = attItems.filter(it => it.kategoriaFrekwencji === 1).length;
      const proc = attItems.length > 0 ? (obecnosci / attItems.length) * 100 : 0;

      set({
        luckyNumber: lucky,
        dashboardLessons: lessons,
        dashboardExams: exams,
        attendancePercent: proc,
        isLoading: false
      });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  loadFullTimetable: async () => {
    const { repository } = get();
    if (!repository) return;
    set({ isLoading: true, error: null });
    try {
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      const lessons = await repository.getTimetable(
        `${formatDate(monday)}T00:00:00.000Z`, 
        `${formatDate(sunday)}T23:59:59.999Z`
      );

      const grouped: Record<string, Lesson[]> = {};
      lessons.forEach(l => {
        const key = (l.data || l.dataOd || '').substring(0, 10);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(l);
      });

      set({ fullTimetable: grouped, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  loadClassificationPeriods: async () => {
    const { repository, selectedPeriodId } = get();
    if (!repository) return;
    try {
      const periods = await repository.getClassificationPeriods();
      set({ classificationPeriods: periods });
      if (periods.length > 0 && selectedPeriodId === null) {
        const last = periods[periods.length - 1];
        const id = last.id || last.Id;
        if (id !== undefined) {
          get().selectPeriod(id);
        }
      }
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  selectPeriod: async (id: number) => {
    const { repository } = get();
    if (!repository) return;
    set({ selectedPeriodId: id, isLoading: true });
    try {
      const grades = await repository.getGrades(id);
      set({ grades, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  loadMessages: async () => {
    const { repository } = get();
    if (!repository) return;
    set({ isLoading: true, error: null });
    try {
      const msgs = await repository.getReceivedMessages();
      set({ messages: msgs, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  loadMessageDetails: async (key: string) => {
    const { repository } = get();
    if (!repository) return;
    set({ isLoading: true, error: null });
    try {
      const detail = await repository.getMessageDetails(key);
      set({ selectedMessage: detail, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  clearSelectedMessage: () => set({ selectedMessage: null }),

  logout: () => {
    set({
      context: null,
      repository: null,
      luckyNumber: '-',
      dashboardLessons: [],
      dashboardExams: [],
      attendancePercent: 0,
      fullTimetable: {},
      classificationPeriods: [],
      selectedPeriodId: null,
      grades: [],
      messages: [],
      selectedMessage: null,
      isLoading: false,
      error: null
    });
  }
}));
