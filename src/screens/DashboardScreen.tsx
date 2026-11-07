import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Surface, Card, Avatar, useTheme, IconButton } from 'react-native-paper';
import { useVulcanStore } from '../state/useVulcanStore';
import { Trophy, Clock, AlertCircle, LogOut } from 'lucide-react-native';

export default function DashboardScreen() {
  const store = useVulcanStore();
  const theme = useTheme();

  useEffect(() => {
    store.loadDashboardData();
  }, []);

  const onRefresh = () => {
    store.loadDashboardData();
  };

  const getSubjectName = (prz: any) => {
    if (typeof prz === 'object' && prz !== null) {
      return prz.nazwa || prz.skrot || 'Nieznany';
    }
    return prz || 'Nieznany';
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const match = iso.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : iso;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={styles.headerTitle}>Dzień dobry!</Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>Twoje podsumowanie dnia</Text>
        </View>
        <IconButton 
          icon={() => <LogOut color={theme.colors.onSurface} size={24} />} 
          onPress={() => store.logout()} 
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={store.isLoading} onRefresh={onRefresh} />
        }
      >
        <View style={styles.topCards}>
          <Surface style={styles.statCard} elevation={1}>
            <Avatar.Icon size={40} icon={() => <Trophy color="#fff" size={24} />} style={{ backgroundColor: theme.colors.primary }} />
            <View style={styles.statInfo}>
              <Text variant="labelSmall">Szczęśliwy numer</Text>
              <Text variant="headlineSmall" style={styles.statValue}>{store.luckyNumber}</Text>
            </View>
          </Surface>

          <Surface style={styles.statCard} elevation={1}>
            <Avatar.Icon size={40} icon={() => <Clock color="#fff" size={24} />} style={{ backgroundColor: '#4CAF50' }} />
            <View style={styles.statInfo}>
              <Text variant="labelSmall">Frekwencja</Text>
              <Text variant="headlineSmall" style={styles.statValue}>{store.attendancePercent.toFixed(1)}%</Text>
            </View>
          </Surface>
        </View>

        <Text variant="titleMedium" style={styles.sectionTitle}>Dzisiejsze lekcje</Text>
        {store.dashboardLessons.length === 0 && !store.isLoading ? (
          <Surface style={styles.emptyCard} elevation={1}>
            <Text>Brak lekcji na dziś</Text>
          </Surface>
        ) : (
          store.dashboardLessons.map((lesson, idx) => (
            <Card key={idx} style={styles.lessonCard} mode="contained">
              <Card.Content style={styles.lessonContent}>
                <View style={styles.lessonTime}>
                  <Text variant="titleMedium">{formatTime(lesson.godzinaOd || lesson.czasOd)}</Text>
                  <Text variant="labelSmall">{formatTime(lesson.godzinaDo || lesson.czasDo)}</Text>
                </View>
                <View style={styles.lessonInfo}>
                  <Text variant="titleMedium" numberOfLines={1}>{getSubjectName(lesson.przedmiot || lesson.przedmiotNazwa)}</Text>
                  <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                    {lesson.sala ? `sala ${typeof lesson.sala === 'object' ? lesson.sala.nazwa : lesson.sala}` : ''}
                  </Text>
                </View>
                {lesson.odwolane && (
                  <Surface style={styles.cancelBadge} elevation={0}>
                    <Text style={{ color: '#fff', fontSize: 10 }}>ODWOŁANE</Text>
                  </Surface>
                )}
              </Card.Content>
            </Card>
          ))
        )}

        <Text variant="titleMedium" style={styles.sectionTitle}>Nadchodzące sprawdziany</Text>
        {store.dashboardExams.length === 0 && !store.isLoading ? (
          <Surface style={styles.emptyCard} elevation={1}>
            <Text>Brak nadchodzących sprawdzianów</Text>
          </Surface>
        ) : (
          store.dashboardExams.map((exam, idx) => (
            <Card key={idx} style={styles.examCard} mode="outlined">
              <Card.Content style={styles.examContent}>
                <AlertCircle color={theme.colors.error} size={20} />
                <View style={styles.examInfo}>
                  <Text variant="titleSmall">{getSubjectName(exam.przedmiot)}</Text>
                  <Text variant="bodySmall" numberOfLines={2}>{exam.temat || exam.opis || exam.nazwa}</Text>
                  <Text variant="labelSmall" style={{ marginTop: 4 }}>Data: {exam.data?.substring(0, 10)}</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerSubtitle: {
    opacity: 0.6,
  },
  scrollContent: {
    padding: 20,
  },
  topCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statInfo: {
    justifyContent: 'center',
  },
  statValue: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  lessonCard: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  lessonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  lessonTime: {
    width: 50,
    alignItems: 'center',
  },
  lessonInfo: {
    flex: 1,
  },
  cancelBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  examCard: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  examContent: {
    flexDirection: 'row',
    gap: 12,
  },
  examInfo: {
    flex: 1,
  },
  emptyCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
});
