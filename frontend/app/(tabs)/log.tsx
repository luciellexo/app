import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useDoseStore } from '../../store/useDoseStore';
import { api } from '../../services/api';
import { Substance, SubstanceRoa } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { getActiveLogs, getDurationTotalMinutes } from '../../utils/substanceUtils';

export default function LogDoseScreen() {
  const router = useRouter();
  const { logs, addLog } = useDoseStore();
  
  // Form State
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Substance[]>([]);
  const [selectedSubstance, setSelectedSubstance] = useState<Substance | null>(null);
  const [selectedRoa, setSelectedRoa] = useState<SubstanceRoa | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Interaction Warning State
  const [interactionWarning, setInteractionWarning] = useState<{name: string, status: string} | null>(null);

  // Search Logic
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await api.searchSubstances(query);
      setSearchResults(results);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Check interactions when substance is selected
  useEffect(() => {
    if (selectedSubstance) {
      const activeLogs = getActiveLogs(logs, {});
      const activeSubstanceNames = new Set(activeLogs.map(l => l.substanceName.toLowerCase()));
      
      if (selectedSubstance.interactions_flat) {
        for (const interaction of selectedSubstance.interactions_flat) {
          if (activeSubstanceNames.has(interaction.name.toLowerCase())) {
             if (interaction.status === 'Dangerous' || interaction.status === 'Unsafe') {
                setInteractionWarning({ name: interaction.name, status: interaction.status });
                return;
             }
          }
        }
      }
      setInteractionWarning(null);
    }
  }, [selectedSubstance, logs]);

  const handleSelectSubstance = async (sub: Substance) => {
    // Fetch full details to get ROAs and Interactions
    const fullSub = await api.getSubstanceDetail(sub.name);
    if (fullSub) {
      setSelectedSubstance(fullSub);
      setQuery(fullSub.name);
      setIsSearching(false);
      // Default ROA
      if (fullSub.roas && fullSub.roas.length > 0) {
        setSelectedRoa(fullSub.roas[0]);
      }
    }
  };

  const handleSave = () => {
    if (!selectedSubstance || !amount || !selectedRoa) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt)) {
      Alert.alert('Error', 'Invalid amount');
      return;
    }

    // Calculate Duration
    const duration = getDurationTotalMinutes(selectedSubstance, selectedRoa.name);

    addLog({
      substanceName: selectedSubstance.name,
      substanceId: selectedSubstance._id,
      amount: amt,
      unit: selectedRoa.dose?.units || 'mg',
      roa: selectedRoa.name,
      timestamp: Date.now(),
      notes: notes,
      estimatedDurationMinutes: duration,
      substanceSnapshot: {
        interactions_flat: selectedSubstance.interactions_flat
      }
    });

    // Reset
    setSelectedSubstance(null);
    setSelectedRoa(null);
    setAmount('');
    setNotes('');
    setQuery('');
    setInteractionWarning(null);
    
    router.replace('/(tabs)');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Substance</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search (e.g., Caffeine)"
          placeholderTextColor="#666"
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setIsSearching(true);
            if (selectedSubstance && t !== selectedSubstance.name) {
               setSelectedSubstance(null);
               setSelectedRoa(null);
            }
          }}
        />
      </View>

      {isSearching && searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          {searchResults.map((item) => (
            <TouchableOpacity 
              key={item.name} 
              style={styles.resultItem}
              onPress={() => handleSelectSubstance(item)}
            >
              <Text style={styles.resultText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {interactionWarning && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={24} color="#CF6679" />
          <Text style={styles.warningText}>
            Warning: Interaction with active {interactionWarning.name} ({interactionWarning.status})
          </Text>
        </View>
      )}

      {selectedSubstance && selectedRoa && (
        <>
          <Text style={styles.label}>Route of Administration</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roaScroll}>
            {selectedSubstance.roas.map((roa) => (
              <TouchableOpacity
                key={roa.name}
                style={[styles.roaChip, selectedRoa.name === roa.name && styles.roaChipSelected]}
                onPress={() => setSelectedRoa(roa)}
              >
                <Text style={[styles.roaText, selectedRoa.name === roa.name && styles.roaTextSelected]}>
                  {roa.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Amount ({selectedRoa.dose?.units || 'mg'})</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#666"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          
          {selectedRoa.dose && (
            <View style={styles.dosageInfo}>
               <Text style={styles.dosageText}>
                 Light: {selectedRoa.dose.light?.min}-{selectedRoa.dose.light?.max} | 
                 Common: {selectedRoa.dose.common?.min}-{selectedRoa.dose.common?.max} | 
                 Strong: {selectedRoa.dose.strong?.min}-{selectedRoa.dose.strong?.max}
               </Text>
            </View>
          )}

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Optional notes..."
            placeholderTextColor="#666"
            multiline
            value={notes}
            onChangeText={setNotes}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Log Dose</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 20, paddingBottom: 40 },
  label: { color: '#BB86FC', fontSize: 16, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333'
  },
  searchContainer: { zIndex: 10 },
  resultsContainer: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  resultText: { color: '#fff' },
  roaScroll: { flexDirection: 'row', marginBottom: 8 },
  roaChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333'
  },
  roaChipSelected: {
    backgroundColor: '#BB86FC',
    borderColor: '#BB86FC'
  },
  roaText: { color: '#ccc' },
  roaTextSelected: { color: '#000', fontWeight: 'bold' },
  textArea: { height: 100, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#03DAC6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32
  },
  saveButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  dosageInfo: { marginTop: 8 },
  dosageText: { color: '#888', fontSize: 12 },
  warningContainer: {
    backgroundColor: 'rgba(207, 102, 121, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CF6679'
  },
  warningText: {
    color: '#CF6679',
    marginLeft: 8,
    flex: 1
  }
});
