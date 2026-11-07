import axios from 'axios';
import { VulcanContext } from '../models/VulcanModels';

/* ── Minimalny parser HTML bez Node.js stdlib (React Native nie ma 'buffer' ani 'node:stream') ── */

/** Wyciąga wartość atrybutu `value` z <input name="X"> */
function getInputValue(html: string, inputName: string): string | null {
  const escaped = inputName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `<input[^>]*\\sname=["']${escaped}["'][^>]*\\svalue=["']([^"']*)["']`,
    'i'
  );
  const match = html.match(regex);
  return match ? match[1] : null;
}

/** Wyciąga pierwszy href z <a> zawierający podany fragment */
function getLinkHref(html: string, hrefContains: string): string | null {
  const escaped = hrefContains.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`<a[^>]*\\shref=["']([^"']*${escaped}[^"']*)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

/** Wyciąga atrybut action z pierwszego <form> */
function getFormAction(html: string): string | null {
  const regex = /<form[^>]*\\saction=["']([^"']*)["']/i;
  const match = html.match(regex);
  return match ? match[1] : null;
}

/** Zwraca listę {name, value} wszystkich <input> w HTML */
function getFormInputs(html: string): Array<{ name: string; value: string }> {
  const inputs: Array<{ name: string; value: string }> = [];
  const regex = /<input[^>]*\\sname=["']([^"']*)["'][^>]*\\svalue=["']([^"']*)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    inputs.push({ name: match[1], value: match[2] });
  }
  return inputs;
}

/* Dekodowanie podwójnego base64 bez Node.js 'buffer'. */
function base64ToUtf8(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export class VulcanLoginHelper {
  private axiosInstance = axios.create({
    withCredentials: true,
    maxRedirects: 5,
  });

  async login(login: string, pass: string): Promise<VulcanContext> {
    // 1. Get login page and CSRF token
    const loginPageRes = await this.axiosInstance.get('https://eduvulcan.pl/logowanie');
    const csrfToken = getInputValue(loginPageRes.data, '__RequestVerificationToken');

    if (!csrfToken) throw new Error('CSRF token not found');

    // 2. Post credentials
    const formData = new URLSearchParams();
    formData.append('UserName', login);
    formData.append('Password', pass);
    formData.append('captcha-response', '');
    formData.append('__RequestVerificationToken', csrfToken);

    await this.axiosInstance.post('https://eduvulcan.pl/logowanie', formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // 3. Get diary access link
    const accessRes = await this.axiosInstance.get('https://eduvulcan.pl/dostep-do-dziennika/');
    const diaryLink = getLinkHref(accessRes.data, '/dziennik?');

    if (!diaryLink) throw new Error('Diary link not found');
    const absoluteDiaryLink = new URL(diaryLink, 'https://eduvulcan.pl').href;

    // 4. Follow SSO redirects
    let currentResponse = await this.axiosInstance.get(absoluteDiaryLink);
    currentResponse = await this.handleSsoPostRedirects(currentResponse);

    // 5. Extract context from final URL
    const finalUrl = currentResponse.config.url || '';
    const pattern = /https:\/\/uczen\.eduvulcan\.pl\/([^/]+)\/App\/([^/]+)\//;
    const match = finalUrl.match(pattern);

    if (!match) throw new Error(`Failed to extract context from URL: ${finalUrl}`);

    const instance = match[1];
    const contextKey = match[2];
    const baseApiUrl = `https://uczen.eduvulcan.pl/${instance}/api/`;
    const baseMessagesApiUrl = `https://wiadomosci.eduvulcan.pl/${instance}/api/`;
    const ids = this.extractIdsFromKey(contextKey);

    // Warm up messages session
    try {
      const messagesWarmupUrl = `https://wiadomosci.eduvulcan.pl/${instance}/App`;
      const msgResponse = await this.axiosInstance.get(messagesWarmupUrl);
      await this.handleSsoPostRedirects(msgResponse);
    } catch (e) {
      console.warn('Messages warmup failed', e);
    }

    return {
      instance,
      contextKey,
      baseApiUrl,
      studentId: ids[0],
      idDziennik: ids[1],
      baseMessagesApiUrl,
    };
  }

  private async handleSsoPostRedirects(response: any): Promise<any> {
    let currentRes = response;
    while (true) {
      const html = currentRes.data;
      if (typeof html === 'string' && html.includes('wresult') && html.includes('<form')) {
        const action = getFormAction(html);
        if (!action) break;

        const absoluteAction = new URL(action, currentRes.config.url).href;
        const formData = new URLSearchParams();
        const inputs = getFormInputs(html);
        for (const input of inputs) {
          formData.append(input.name, input.value);
        }

        currentRes = await this.axiosInstance.post(absoluteAction, formData.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      } else {
        break;
      }
    }
    return currentRes;
  }

  private extractIdsFromKey(contextKey: string): [string, string] {
    try {
      const step1 = base64ToUtf8(contextKey);
      const step2 = base64ToUtf8(step1);
      const parts = step2.split('-');
      return [parts[0], parts[1]];
    } catch (e) {
      throw new Error('Failed to decode context key');
    }
  }
}
