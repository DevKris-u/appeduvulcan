import * as SecureStore from 'expo-secure-store';
import { VulcanContext } from '../models/VulcanModels';

const SESSION_KEY = 'eduvulcan_session';

export const saveSession = async (context: VulcanContext): Promise<void> => {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(context));
};

export const loadSession = async (): Promise<VulcanContext | null> => {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VulcanContext;
  } catch {
    return null;
  }
};

export const clearSession = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(SESSION_KEY);
};
