import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Button } from 'react-native';
import { Text, Surface, Card, IconButton, Divider, useTheme } from 'react-native-paper';
import { useVulcanStore } from '../state/useVulcanStore';
import { Mail, MailOpen, ArrowLeft } from 'lucide-react-native';

export default function MessagesScreen() {
  const store = useVulcanStore();
  const theme = useTheme();

  useEffect(() => {
    store.loadMessages();
  }, []);

  const onRefresh = () => {
    store.clearError();
    store.loadMessages();
  };

  const onRetry = () => {
    store.clearError();
    store.loadMessages();
  };

  if (store.selectedMessage) {
    return (
      <View style={styles.container}>
        <Surface style={styles.detailHeader} elevation={1}>
          <IconButton
            icon={() => <ArrowLeft size={24} color="#333" />}
            onPress={() => store.clearSelectedMessage()}
          />
          <Text variant="titleMedium" style={styles.detailHeaderTitle}>
            Wiadomość
          </Text>
        </Surface>
        <ScrollView contentContainerStyle={styles.detailContent}>
          <Text variant="headlineSmall" style={styles.detailSubject}>
            {store.selectedMessage.temat || '(Bez tematu)'}
          </Text>
          <View style={styles.senderInfo}>
            <Surface style={styles.avatar} elevation={0}>
              <Text style={styles.avatarText}>
                {(store.selectedMessage.nadawca?.substring(0, 1) || '?').toUpperCase()}
              </Text>
            </Surface>
            <View>
              <Text variant="titleMedium">{store.selectedMessage.nadawca}</Text>
              <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                Do: {store.selectedMessage.adresaci?.map((a) => a.nazwa).join(', ') || 'mnie'}
              </Text>
              <Text variant="labelSmall" style={{ opacity: 0.5 }}>
                {store.selectedMessage.data?.replace('T', ' ')}
              </Text>
            </View>
          </View>
          <Divider style={styles.divider} />
          <Text variant="bodyLarge" style={styles.messageBody}>
            {store.selectedMessage.tresc}
          </Text>
        </ScrollView>
      </View>
    );
  }

  if (store.error) {
    return (
      <View style={styles.container}>
        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Wiadomości
          </Text>
        </Surface>
        <View style={[styles.errorContainer, { marginTop: 24 }]}>
          <Text variant="titleLarge" style={styles.errorTitle}>
            Coś poszło nie tak
          </Text>
          <Text variant="bodyMedium" style={styles.errorMessage}>
            {store.error.message}
          </Text>
          <View style={styles.retryButton}>
            <Button title="Spróbuj ponownie" onPress={onRetry} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={1}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Wiadomości
        </Text>
      </Surface>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={store.isLoading} onRefresh={onRefresh} />}
      >
        {store.messages.length === 0 && !store.isLoading ? (
          <View style={styles.emptyContainer}>
            <Mail size={48} color="#ccc" />
            <Text variant="bodyLarge" style={{ marginTop: 12 }}>
              Brak wiadomości
            </Text>
          </View>
        ) : (
          store.messages.map((msg) => (
            <Card
              key={msg.apiGlobalKey}
              style={[styles.messageCard, !msg.przeczytana && styles.unreadCard]}
              mode="contained"
              onPress={() => store.loadMessageDetails(msg.apiGlobalKey)}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.msgIcon}>
                  {msg.przeczytana ? (
                    <MailOpen size={24} color="#999" />
                  ) : (
                    <Mail size={24} color={theme.colors.primary} />
                  )}
                </View>
                <View style={styles.msgInfo}>
                  <View style={styles.msgTopRow}>
                    <Text
                      variant="titleMedium"
                      style={!msg.przeczytana && styles.boldText}
                      numberOfLines={1}
                    >
                      {msg.nadawca}
                    </Text>
                    <Text variant="labelSmall" style={styles.msgDate}>
                      {msg.data?.substring(0, 10)}
                    </Text>
                  </View>
                  <Text
                    variant="bodyMedium"
                    style={[styles.msgSubject, !msg.przeczytana && styles.boldText]}
                    numberOfLines={1}
                  >
                    {msg.temat || '(Bez tematu)'}
                  </Text>
                  <Text variant="bodySmall" style={styles.msgSnippet} numberOfLines={1}>
                    {msg.tresc}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 80,
    alignItems: 'center',
    opacity: 0.5,
  },
  messageCard: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  unreadCard: {
    backgroundColor: '#f0ebf7',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  msgIcon: {
    width: 40,
    alignItems: 'center',
  },
  msgInfo: {
    flex: 1,
  },
  msgTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  msgDate: {
    opacity: 0.6,
  },
  msgSubject: {
    marginVertical: 2,
  },
  msgSnippet: {
    opacity: 0.6,
  },
  boldText: {
    fontWeight: 'bold',
  },
  detailHeader: {
    paddingTop: 50,
    paddingBottom: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailHeaderTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  detailContent: {
    padding: 20,
  },
  detailSubject: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6750A4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  messageBody: {
    lineHeight: 24,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  retryButton: {
    marginTop: 8,
  },
});
