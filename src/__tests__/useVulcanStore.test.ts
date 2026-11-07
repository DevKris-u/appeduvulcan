import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useVulcanStore } from '../state/useVulcanStore';
import { VulcanRepository } from '../api/VulcanRepository';
import { Lesson, Attendance, VulcanContext } from '../models/VulcanModels';

// Mock repository
const mockGetDashboardTimetable = jest.fn() as any;
const mockGetDashboardExams = jest.fn() as any;
const mockGetDashboardAttendance = jest.fn() as any;
const mockGetLuckyNumber = jest.fn() as any;

jest.mock('../api/VulcanRepository', () => ({
  VulcanRepository: jest.fn().mockImplementation(() => ({
    getDashboardTimetable: mockGetDashboardTimetable,
    getDashboardExams: mockGetDashboardExams,
    getDashboardAttendance: mockGetDashboardAttendance,
    getLuckyNumber: mockGetLuckyNumber,
  })),
}));

const context: VulcanContext = {
  instance: 'test',
  contextKey: 'abc',
  baseApiUrl: 'https://uczen.eduvulcan.pl/test/api/',
  studentId: '1',
  idDziennik: '2',
  baseMessagesApiUrl: 'https://wiadomosci.eduvulcan.pl/test/api/',
};

beforeEach(() => {
  jest.clearAllMocks();
  useVulcanStore.setState({
    context: null,
    repository: null,
    dashboardLessons: [],
    dashboardExams: [],
    attendancePercent: 0,
    luckyNumber: '-',
    error: null,
    isLoading: false,
  });
});

describe('useVulcanStore', () => {
  it('powinien obliczyć frekwencję jako procent obecności', async () => {
    mockGetDashboardAttendance.mockResolvedValue({
      oddzialy: [
        { kategoriaFrekwencji: 1 },
        { kategoriaFrekwencji: 1 },
        { kategoriaFrekwencji: 2 },
        { kategoriaFrekwencji: 1 },
      ],
    } as Attendance);
    mockGetLuckyNumber.mockResolvedValue('7');
    mockGetDashboardTimetable.mockResolvedValue([]);
    mockGetDashboardExams.mockResolvedValue([]);

    useVulcanStore.setState({ context, repository: new VulcanRepository(context) as any });
    await useVulcanStore.getState().loadDashboardData();

    const state = useVulcanStore.getState();
    expect(state.attendancePercent).toBe(75); // 3 z 4 = 75%
  });

  it('powinien zwrócić 0% frekwencji gdy brak danych', async () => {
    mockGetDashboardAttendance.mockResolvedValue({ oddzialy: [] } as Attendance);
    mockGetLuckyNumber.mockResolvedValue('-');
    mockGetDashboardTimetable.mockResolvedValue([]);
    mockGetDashboardExams.mockResolvedValue([]);

    useVulcanStore.setState({ context, repository: new VulcanRepository(context) as any });
    await useVulcanStore.getState().loadDashboardData();

    expect(useVulcanStore.getState().attendancePercent).toBe(0);
  });

  it('powinien zapisać lekcje z dashboardu', async () => {
    const lessons: Lesson[] = [
      { numerLekcji: 2, przedmiotNazwa: 'Matematyka' },
      { numerLekcji: 1, przedmiotNazwa: 'Polski' },
    ];
    mockGetDashboardTimetable.mockResolvedValue(lessons);
    mockGetDashboardExams.mockResolvedValue([]);
    mockGetLuckyNumber.mockResolvedValue('-');
    mockGetDashboardAttendance.mockResolvedValue({ oddzialy: [] } as Attendance);

    useVulcanStore.setState({ context, repository: new VulcanRepository(context) as any });
    await useVulcanStore.getState().loadDashboardData();

    expect(useVulcanStore.getState().dashboardLessons).toEqual(lessons);
  });
});
