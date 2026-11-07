import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Button,
} from 'react-native';
import { Text, Surface, Card, List, Portal, Modal, IconButton, Divider } from 'react-native-paper';
import { useVulcanStore } from '../state/useVulcanStore';
import { ChevronRight, X } from 'lucide-react-native';

export default function GradesScreen() {
  const store = useVulcanStore();
  const [selectedSubject, setSelectedSubject] = useState<any>(null);

  useEffect(() => {
    store.loadClassificationPeriods();
  }, []);

  const onRefresh = () => {
    store.clearError();
    if (store.selectedPeriodId) {
      store.selectPeriod(store.selectedPeriodId);
    }
  };

  const onRetry = () => {
    store.clearError();
    store.loadClassificationPeriods();
  };

  const getSubjectName = (prz: any) => {
    if (typeof prz === 'object' && prz !== null) {
      return prz.nazwa || prz.skrot || 'Nieznany';
    }
    return prz || 'Nieznany';
  };

  const getGradeValue = (col: any) => {
    const v = col.wpis || col.ocena || col.wartosc;
    if (v) return v;
    if (col.oceny && col.oceny.length > 0) {
      const first = col.oceny[0];
      return typeof first === 'object' ? first.wpis || first.wartosc || first.kod : first;
    }
    return '-';
  };

  const subjectKey = (item: any, idx: number) => {
    return item.id ? `subject-${item.id}` : `subject-${idx}-${item.przedmiotNazwa || ''}`;
  };

  const columnKey = (col: any, idx: number) => {
    return `col-${idx}-${col.nazwa || col.wpis || col.ocena || ''}`;
  };

  if (store.error) {
    return (
      <View style={styles.container}>
        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Oceny
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
          Oceny
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
          {store.classificationPeriods.map((period, idx) => {
            const id = period.id ?? period.Id;
            const isSelected = store.selectedPeriodId === id;
            return (
              <TouchableOpacity
                key={`period-${idx}-${id}`}
                style={[styles.periodChip, isSelected && styles.periodChipSelected]}
                onPress={() => id && store.selectPeriod(id)}
              >
                <Text style={[styles.periodText, isSelected && styles.periodTextSelected]}>
                  Okres {period.numerOkresu}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Surface>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={store.isLoading} onRefresh={onRefresh} />}
      >
        {store.grades.length === 0 && !store.isLoading ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">Brak ocen w tym okresie</Text>
          </View>
        ) : (
          store.grades.map((item, idx) => (
            <Card
              key={subjectKey(item, idx)}
              style={styles.subjectCard}
              mode="contained"
              onPress={() => setSelectedSubject(item)}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.subjectInfo}>
                  <Text variant="titleMedium" numberOfLines={1}>
                    {getSubjectName(item.przedmiot || item.przedmiotNazwa)}
                  </Text>
                  <Text variant="bodySmall" style={styles.gradesSnippet}>
                    {item.kolumnyOcenyCzastkowe?.map((c) => getGradeValue(c)).join(', ') ||
                      'Brak ocen'}
                  </Text>
                </View>
                <View style={styles.subjectStats}>
                  <Text variant="headlineSmall" style={styles.averageText}>
                    {item.srednia ? item.srednia.toFixed(2) : '-'}
                  </Text>
                  <ChevronRight size={20} color="#ccc" />
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={!!selectedSubject}
          onDismiss={() => setSelectedSubject(null)}
          contentContainerStyle={styles.modal}
        >
          {selectedSubject && (
            <View>
              <View style={styles.modalHeader}>
                <Text variant="titleLarge" style={styles.modalTitle}>
                  {getSubjectName(selectedSubject.przedmiot || selectedSubject.przedmiotNazwa)}
                </Text>
                <IconButton icon={() => <X size={24} />} onPress={() => setSelectedSubject(null)} />
              </View>
              <ScrollView style={styles.gradeList}>
                {selectedSubject.kolumnyOcenyCzastkowe?.map((col: any, idx: number) => (
                  <List.Item
                    key={columnKey(col, idx)}
                    title={getGradeValue(col)}
                    description={`${col.nazwa || 'Ocena'} • waga: ${col.waga ?? col.wagaOceny ?? '-'}`}
                    left={() => <Text style={styles.gradeLabel}>{getGradeValue(col)}</Text>}
                    right={() => <Text variant="bodySmall">{col.data?.substring(0, 10)}</Text>}
                    style={styles.gradeItem}
                  />
                ))}
              </ScrollView>
              <View style={styles.closeBtn}>
                <Button title="Zamknij" onPress={() => setSelectedSubject(null)} />
              </View>
            </View>
          )}
        </Modal>
      </Portal>
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
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  periodScroll: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  periodChipSelected: {
    backgroundColor: '#6750A4',
  },
  periodText: {
    color: '#333',
    fontWeight: '500',
  },
  periodTextSelected: {
    color: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  subjectCard: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectInfo: {
    flex: 1,
  },
  gradesSnippet: {
    opacity: 0.6,
    marginTop: 4,
  },
  subjectStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  averageText: {
    fontWeight: 'bold',
    color: '#6750A4',
  },
  modal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  gradeList: {
    maxHeight: 400,
  },
  gradeItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  gradeLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
    color: '#6750A4',
    alignSelf: 'center',
  },
  closeBtn: {
    marginTop: 16,
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
