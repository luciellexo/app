import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useDoseStore } from '../../store/useDoseStore';
import { getActiveLogs } from '../../utils/substanceUtils';
import { formatDistanceToNow, format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { logs, removeLog } = useDoseStore();
  const [activeLogs, setActiveLogs] = useState<any[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
        setNow(Date.now());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const active = getActiveLogs(logs, {});
    setActiveLogs(active);
    setHistoryLogs(logs.filter(l => !active.includes(l)));
  }, [logs, now]);

  const renderActiveItem = ({ item }: { item: any }) => {
    const startTime = item.timestamp;
    const duration = (item.estimatedDurationMinutes || 240) * 60 * 1000;
    const endTime = startTime + duration;
    const timeLeft = endTime - now;
    const progress = Math.max(0, Math.min(100, (1 - timeLeft / duration) * 100));

    return (
      <View style={styles.activeCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.substanceName}>{item.substanceName}</Text>
          <TouchableOpacity onPress={() => removeLog(item.id)}>
             <Ionicons name="trash-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <Text style={styles.doseDetail}>{item.amount} {item.unit} via {item.roa}</Text>
        
        <View style={styles.timerContainer}>
           <Text style={styles.timerText}>
              Active for {formatDistanceToNow(item.timestamp)}
           </Text>
           <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
           </View>
        </View>
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.historyItem}>
       <View>
         <Text style={styles.historyName}>{item.substanceName}</Text>
         <Text style={styles.historyDetail}>{item.amount} {item.unit} • {format(item.timestamp, 'MMM d, h:mm a')}</Text>
       </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Substances</Text>
        {activeLogs.length === 0 ? (
          <Text style={styles.emptyText}>No active substances</Text>
        ) : (
          <FlatList
            data={activeLogs}
            renderItem={renderActiveItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>

      <View style={[styles.section, { flex: 1 }]}>
        <Text style={styles.sectionTitle}>History</Text>
        <FlatList
          data={historyLogs}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#BB86FC', marginBottom: 12 },
  emptyText: { color: '#666', fontStyle: 'italic' },
  activeCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 250,
    borderLeftWidth: 4,
    borderLeftColor: '#03DAC6'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  substanceName: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  doseDetail: { color: '#ccc', fontSize: 14, marginBottom: 12 },
  timerContainer: { marginTop: 8 },
  timerText: { color: '#03DAC6', fontSize: 12, marginBottom: 4 },
  progressBarBg: { height: 4, backgroundColor: '#333', borderRadius: 2 },
  progressBarFill: { height: 4, backgroundColor: '#03DAC6', borderRadius: 2 },
  historyItem: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  historyName: { color: '#fff', fontSize: 16, fontWeight: '500' },
  historyDetail: { color: '#888', fontSize: 12, marginTop: 4 }
});
