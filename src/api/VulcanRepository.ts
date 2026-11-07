import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import {
  Lesson,
  Exam,
  Attendance,
  ClassificationPeriod,
  SubjectGrades,
  MessageListItem,
  MessageDetail,
  VulcanContext,
} from '../models/VulcanModels';
import {
  validate,
  validateArray,
  ValidationError,
  LessonsResponseSchema,
  ExamsResponseSchema,
  AttendanceResponseSchema,
  ClassificationPeriodsResponseSchema,
  GradesResponseSchema,
  MessageBoxesResponseSchema,
  ReceivedMessagesResponseSchema,
  MessageDetailResponseSchema,
  LuckyNumberResponseSchema,
} from './validators';

const REQUEST_TIMEOUT = 20_000; // ms
const RETRY_ATTEMPTS = 3;

function withRetryAndTimeout(instance: AxiosInstance): AxiosInstance {
  axiosRetry(instance, {
    retries: RETRY_ATTEMPTS,
    retryDelay: (retryCount) => retryCount * 1000, // 1s, 2s, 3s
    retryCondition: (error) => {
      // Ponów tylko przy błędach sieciowych i 429/5xx
      if (axiosRetry.isNetworkOrIdempotentRequestError(error)) return true;
      const status = error.response?.status;
      return status === 429 || (status !== undefined && status >= 500);
    },
  });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    config.timeout = REQUEST_TIMEOUT;
    return config;
  });

  return instance;
}

export class VulcanRepository {
  private api: AxiosInstance;
  private messagesApi: AxiosInstance;
  private context: VulcanContext | null = null;

  constructor(context: VulcanContext) {
    this.context = context;
    this.api = withRetryAndTimeout(
      axios.create({
        baseURL: context.baseApiUrl,
        withCredentials: true,
      })
    );
    this.messagesApi = withRetryAndTimeout(
      axios.create({
        baseURL: context.baseMessagesApiUrl,
        withCredentials: true,
      })
    );
  }

  private get contextKey() {
    return this.context?.contextKey;
  }

  private get idDziennik() {
    return this.context?.idDziennik;
  }

  async getLuckyNumber(): Promise<string> {
    const res = await this.api.get<string>('SzczesliwyNumerTablica', {
      params: { key: this.contextKey },
    });
    const text = validate(LuckyNumberResponseSchema, res.data, 'SzczesliwyNumerTablica') as
      string | null;
    const cleaned = text ? text.replace(/"/g, '') : null;
    return cleaned === null || cleaned === 'null' || cleaned === '' ? 'brak' : cleaned;
  }

  async getDashboardTimetable(): Promise<Lesson[]> {
    const res = await this.api.get<Lesson[]>('PlanZajecTablica', {
      params: { key: this.contextKey },
    });
    return validateArray(LessonsResponseSchema, res.data, 'PlanZajecTablica');
  }

  async getDashboardExams(): Promise<Exam[]> {
    const res = await this.api.get<Exam[]>('SprawdzianyTablica', {
      params: { key: this.contextKey },
    });
    return validateArray(ExamsResponseSchema, res.data, 'SprawdzianyTablica');
  }

  async getDashboardAttendance(): Promise<Attendance> {
    const res = await this.api.get<Attendance>('FrekwencjaTablica', {
      params: { key: this.contextKey },
    });
    return validate(AttendanceResponseSchema, res.data, 'FrekwencjaTablica');
  }

  async getTimetable(dataOd: string, dataDo: string): Promise<Lesson[]> {
    const res = await this.api.get<Lesson[]>('PlanZajec', {
      params: {
        key: this.contextKey,
        dataOd,
        dataDo,
        zakresDanych: 2,
      },
    });
    return validateArray(LessonsResponseSchema, res.data, 'PlanZajec');
  }

  async getClassificationPeriods(): Promise<ClassificationPeriod[]> {
    const res = await this.api.get<ClassificationPeriod[]>('OkresyKlasyfikacyjne', {
      params: {
        key: this.contextKey,
        idDziennik: this.idDziennik,
      },
    });
    return validateArray(ClassificationPeriodsResponseSchema, res.data, 'OkresyKlasyfikacyjne');
  }

  async getGrades(periodId: number): Promise<SubjectGrades[]> {
    const res = await this.api.get<{ ocenyPrzedmioty: SubjectGrades[] }>('Oceny', {
      params: {
        key: this.contextKey,
        idOkresKlasyfikacyjny: periodId,
      },
    });
    const parsed = validate<{ ocenyPrzedmioty?: SubjectGrades[] }>(
      GradesResponseSchema,
      res.data,
      'Oceny'
    );
    return parsed.ocenyPrzedmioty ?? [];
  }

  async getMessageBoxes(): Promise<any[]> {
    const res = await this.messagesApi.get('Skrzynki');
    return validate(MessageBoxesResponseSchema, res.data, 'Skrzynki');
  }

  async getReceivedMessages(): Promise<MessageListItem[]> {
    const res = await this.messagesApi.get<MessageListItem[]>('Odebrane', {
      params: { idLastWiadomosc: 0, pageSize: 50 },
    });
    return validateArray(ReceivedMessagesResponseSchema, res.data, 'Odebrane');
  }

  async getMessageDetails(key: string): Promise<MessageDetail> {
    const res = await this.messagesApi.get<MessageDetail>('WiadomoscSzczegoly', {
      params: { apiGlobalKey: key },
    });
    return validate(MessageDetailResponseSchema, res.data, 'WiadomoscSzczegoly');
  }
}
