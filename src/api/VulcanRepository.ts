import axios, { AxiosInstance } from 'axios';
import { 
  LuckyNumber, Lesson, Exam, Attendance, 
  ClassificationPeriod, SubjectGrades, 
  MessageListItem, MessageDetail, VulcanContext 
} from '../models/VulcanModels';

export class VulcanRepository {
  private api: AxiosInstance;
  private messagesApi: AxiosInstance;
  private context: VulcanContext | null = null;

  constructor(context: VulcanContext) {
    this.context = context;
    this.api = axios.create({
      baseURL: context.baseApiUrl,
      withCredentials: true,
    });
    this.messagesApi = axios.create({
      baseURL: context.baseMessagesApiUrl,
      withCredentials: true,
    });
  }

  async getLuckyNumber(): Promise<string> {
    const res = await this.api.get<string>('SzczesliwyNumerTablica', {
      params: { key: this.context?.contextKey }
    });
    const text = res.data || 'brak';
    return text.replace(/"/g, '') === 'null' ? 'brak' : text.replace(/"/g, '');
  }

  async getDashboardTimetable(): Promise<Lesson[]> {
    const res = await this.api.get<Lesson[]>('PlanZajecTablica', {
      params: { key: this.context?.contextKey }
    });
    return res.data;
  }

  async getDashboardExams(): Promise<Exam[]> {
    const res = await this.api.get<Exam[]>('SprawdzianyTablica', {
      params: { key: this.context?.contextKey }
    });
    return res.data;
  }

  async getDashboardAttendance(): Promise<Attendance> {
    const res = await this.api.get<Attendance>('FrekwencjaTablica', {
      params: { key: this.context?.contextKey }
    });
    return res.data;
  }

  async getTimetable(dataOd: string, dataDo: string): Promise<Lesson[]> {
    const res = await this.api.get<Lesson[]>('PlanZajec', {
      params: { 
        key: this.context?.contextKey,
        dataOd,
        dataDo,
        zakresDanych: 2
      }
    });
    return res.data;
  }

  async getClassificationPeriods(): Promise<ClassificationPeriod[]> {
    const res = await this.api.get<ClassificationPeriod[]>('OkresyKlasyfikacyjne', {
      params: { 
        key: this.context?.contextKey,
        idDziennik: this.context?.idDziennik
      }
    });
    return res.data;
  }

  async getGrades(periodId: number): Promise<SubjectGrades[]> {
    const res = await this.api.get<{ ocenyPrzedmioty: SubjectGrades[] }>('Oceny', {
      params: { 
        key: this.context?.contextKey,
        idOkresKlasyfikacyjny: periodId
      }
    });
    return res.data.ocenyPrzedmioty || [];
  }

  async getMessageBoxes(): Promise<any[]> {
    const res = await this.messagesApi.get('Skrzynki');
    return res.data;
  }

  async getReceivedMessages(): Promise<MessageListItem[]> {
    const res = await this.messagesApi.get<MessageListItem[]>('Odebrane', {
      params: { idLastWiadomosc: 0, pageSize: 50 }
    });
    return res.data;
  }

  async getMessageDetails(key: string): Promise<MessageDetail> {
    const res = await this.messagesApi.get<MessageDetail>('WiadomoscSzczegoly', {
      params: { apiGlobalKey: key }
    });
    return res.data;
  }
}
