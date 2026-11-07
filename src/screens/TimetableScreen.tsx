import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Button } from 'react-native';
import { Text, Surface, Card, SegmentedButtons } from 'react-native-paper';
import { useVulcanStore } from '../state/useVulcanStore';
import { format, addDays, startOfWeek } from 'date-fns';
import { pl } from 'date-fns/locale';

export default function TimetableScreen() {
  const store = useVulcanStore();

  const [selectedDay, setSelectedDay] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [days, setDays] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 5 }).map((_, i) => {
      const d = addDays(start, i);
      return {
        label: format(d, 'EEE', { locale: pl }).toUpperCase(),
        value: format(d, 'yyyy-MM-dd'),
      };
    });
    setDays(weekDays);
    store.loadFullTimetable();
  }, []);

  const onRefresh = () => {
    store.clearError();
    store.loadFullTimetable();
  };

  const onRetry = () => {
    store.clearError();
    store.loadFullTimetable();
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

  const lessonKey = (lesson: any, idx: number) => {
    return lesson.id
      ? `lesson-${lesson.id}`
      : `timetable-${idx}-${lesson.dataOd || lesson.data || ''}-${lesson.godzinaOd || lesson.czasOd || ''}`;
  };

  const lessons = store.fullTimetable[selectedDay] || [];

  if (store.error) {
    return (
      <View style={styles.container}>
        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Plan zajęć
          </Text>
          <SegmentedButtons
            value={selectedDay}
            onValueChange={setSelectedDay}
            buttons={days}
            style={styles.selector}
          />
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
          Plan zajęć
        </Text>
        <SegmentedButtons
          value={selectedDay}
          onValueChange={setSelectedDay}
          buttons={days}
          style={styles.selector}
        />
      </Surface>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={store.isLoading} onRefresh={onRefresh} />}
      >
        {lessons.length === 0 && !store.isLoading ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">Brak zajęć w tym dniu</Text>
          </View>
        ) : (
          lessons
            .sort((a, b) => (a.numerLekcji || 0) - (b.numerLekcji || 0))
            .map((lesson, idx) => (
              <Card
                key={lessonKey(lesson, idx)}
                style={[styles.lessonCard, lesson.odwolane && styles.cancelledCard]}
                mode="contained"
              >
                <Card.Content style={styles.lessonContent}>
                  <View style={styles.lessonTime}>
                    <Text variant="titleMedium">
                      {formatTime(lesson.godzinaOd || lesson.czasOd)}
                    </Text>
                    <Text variant="labelSmall">
                      {formatTime(lesson.godzinaDo || lesson.czasDo)}
                    </Text>
                  </View>
                  <View style={styles.lessonInfo}>
                    <View style={styles.titleRow}>
                      <Text variant="titleMedium" numberOfLines={1}>
                        {getSubjectName(lesson.przedmiot || lesson.przedmiotNazwa)}
                      </Text>
                      {lesson.odwolane && <Text style={styles.cancelledText}>ODWOŁANE</Text>}
                    </View>
                    <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                      {lesson.nauczyciel
                        ? typeof lesson.nauczyciel === 'object'
                          ? `${lesson.nauczyciel.imie} ${lesson.nauczyciel.nazwisko}`
                          : lesson.nauczyciel
                        : ''}
                      {lesson.sala
                        ? ` • sala ${typeof lesson.sala === 'object' ? lesson.sala.nazwa : lesson.sala}`
                        : ''}
                    </Text>
                    {lesson.zmianaInfo && (
                      <Text variant="labelSmall" style={styles.changeInfo}>
                        {lesson.zmianaInfo}
                      </Text>
                    )}
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
    marginBottom: 16,
  },
  selector: {
    marginHorizontal: 0,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  lessonCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  cancelledCard: {
    opacity: 0.6,
    backgroundColor: '#ffebee',
  },
  lessonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  lessonTime: {
    width: 60,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    paddingRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelledText: {
    color: '#D32F2F',
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#ffcdd2',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  changeInfo: {
    color: '#6750A4',
    marginTop: 4,
    fontStyle: 'italic',
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
