import { create } from 'zustand';
import {
  Lesson,
  Exam,
  ClassificationPeriod,
  SubjectGrades,
  MessageListItem,
  MessageDetail,
  VulcanContext,
} from '../models/VulcanModels';
import { VulcanRepository } from '../api/VulcanRepository';
import { ValidationError } from '../api/validators';
import { saveSession, clearSession, loadSession } from '../storage/session';

interface AppError {
  message: string;
  type: 'network' | 'validation' | 'auth' | 'unknown';
}

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
  error: AppError | null;

  setContext: (context: VulcanContext) => void;
  loadDashboardData: () => Promise<void>;
  loadFullTimetable: () => Promise<void>;
  loadClassificationPeriods: () => Promise<void>;
  selectPeriod: (id: number) => Promise<void>;
  loadMessages: () => Promise<void>;
  loadMessageDetails: (key: string) => Promise<void>;
  clearSelectedMessage: () => void;
  logout: () => void;
  clearError: () => void;
}

function classifyError(e: unknown): AppError {
  if (e instanceof ValidationError) {
    return { message: e.message, type: 'validation' };
  }
  const axiosErr = e as { code?: string; message?: string; response?: { status?: number } };
  if (axiosErr.code === 'ECONNABORTED' || axiosErr.code === 'ERR_NETWORK' || !axiosErr.response) {
    return { message: 'Brak połączenia z internetem lub serwer nie odpowiada.', type: 'network' };
  }
  if (axiosErr.response?.status === 401 || axiosErr.response?.status === 403) {
    return { message: 'Sesja wygasła. Zaloguj się ponownie.', type: 'auth' };
  }
  return { message: axiosErr.message || 'Wystąpił nieznany błąd.', type: 'unknown' };
}

export const useVulcanStore = create<
  VulcanState & {
    initializeSession: () => Promise<void>;
  }
>((set, get) => ({
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

  setContext: async (context: VulcanContext) => {
    set({
      context,
      repository: new VulcanRepository(context),
      error: null,
    });
    await saveSession(context).catch(() => {
      // Nie blokujemy aplikacji jeśli secure store niedostępny
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
        repository.getDashboardAttendance(),
      ]);

      const attItems = attendance.oddzialy || [];
      const obecnosci = attItems.filter((it) => it.kategoriaFrekwencji === 1).length;
      const proc = attItems.length > 0 ? (obecnosci / attItems.length) * 100 : 0;

      set({
        luckyNumber: lucky,
        dashboardLessons: lessons,
        dashboardExams: exams,
        attendancePercent: proc,
        isLoading: false,
      });
    } catch (e: any) {
      set({ isLoading: false, error: classifyError(e) });
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
        `${formatDate(monday)}T00:00:00`,
        `${formatDate(sunday)}T23:59:59`
      );

      const grouped: Record<string, Lesson[]> = {};
      lessons.forEach((l) => {
        const key = (l.data || l.dataOd || '').substring(0, 10);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(l);
      });

      set({ fullTimetable: grouped, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: classifyError(e) });
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
        const id = last.id ?? last.Id;
        if (id !== undefined) {
          get().selectPeriod(id);
        }
      }
    } catch (e: any) {
      set({ error: classifyError(e) });
    }
  },

  selectPeriod: async (id: number) => {
    const { repository } = get();
    if (!repository) return;
    set({ selectedPeriodId: id, isLoading: true, error: null });
    try {
      const grades = await repository.getGrades(id);
      set({ grades, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: classifyError(e) });
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
      set({ isLoading: false, error: classifyError(e) });
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
      set({ isLoading: false, error: classifyError(e) });
    }
  },

  clearSelectedMessage: () => set({ selectedMessage: null }),

  clearError: () => set({ error: null }),

  logout: async () => {
    await clearSession().catch(() => {
      // Nie blokujemy aplikacji jeśli secure store niedostępny
    });
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
      error: null,
    });
  },

  initializeSession: async () => {
    const session = await loadSession();
    if (session) {
      set({
        context: session,
        repository: new VulcanRepository(session),
      });
    }
  },
}));
