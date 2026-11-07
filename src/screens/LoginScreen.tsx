import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme, ActivityIndicator } from 'react-native-paper';
import { useVulcanStore } from '../state/useVulcanStore';
import { VulcanLoginHelper } from '../api/VulcanLoginHelper';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setContext = useVulcanStore(state => state.setContext);
  const theme = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Wprowadź e-mail i hasło');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const helper = new VulcanLoginHelper();
      const context = await helper.login(email, password);
      setContext(context);
    } catch (e: any) {
      setError(e.message || 'Błąd logowania');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.surface} elevation={2}>
          <Text variant="headlineMedium" style={styles.title}>EduVulcan</Text>
          <Text variant="bodyLarge" style={styles.subtitle}>Zaloguj się do swojego konta</Text>

          {error && (
            <Text style={[styles.error, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            mode="outlined"
            disabled={isLoading}
          />

          <TextInput
            label="Hasło"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            mode="outlined"
            disabled={isLoading}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Zaloguj
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  surface: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  error: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
});
