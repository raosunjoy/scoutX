import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Picker } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MintScreen = ({ navigation }) => {
  const [cohortId, setCohortId] = useState('');
  const [sport, setSport] = useState('cricket');
  const [initialSupply, setInitialSupply] = useState('');
  const [token, setToken] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const adminToken = await AsyncStorage.getItem('adminToken');
      if (!adminToken) {
        Alert.alert('Error', 'Please login first');
        navigation.navigate('Login');
      } else {
        setToken(adminToken);
      }
    };
    checkAuth();
  }, [navigation]);

  const handleMint = async () => {
    if (!cohortId || !sport || !initialSupply) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:3000/mint/token',
        {
          cohortId,
          sport,
          initialSupply: parseInt(initialSupply),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Alert.alert(
        'Success',
        `Token minted!\nCohort: ${response.data.cohortId}\nToken Address: ${response.data.tokenAddress}\nSupply: ${response.data.initialSupply}\nTransaction: ${response.data.transaction}`,
      );
      setCohortId('');
      setSport('cricket');
      setInitialSupply('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Minting failed');
    }
  };

  if (!token) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mint Tokens</Text>
      <TextInput
        style={styles.input}
        placeholder="Cohort ID (e.g., BUCC_2026)"
        value={cohortId}
        onChangeText={setCohortId}
      />
      <Picker
        selectedValue={sport}
        style={styles.picker}
        onValueChange={(itemValue) => setSport(itemValue)}
      >
        <Picker.Item label="Cricket" value="cricket" />
        <Picker.Item label="Football" value="football" />
        <Picker.Item label="Basketball" value="basketball" />
      </Picker>
      <TextInput
        style={styles.input}
        placeholder="Initial Supply (e.g., 10000)"
        value={initialSupply}
        onChangeText={setInitialSupply}
        keyboardType="numeric"
      />
      <Button title="Mint Token" onPress={handleMint} color="#1E90FF" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', justifyContent: 'center' },
  title: { fontSize: 24, fontFamily: 'Inter', color: '#1E90FF', textAlign: 'center', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
  picker: { height: 50, width: '100%', marginBottom: 15 },
});

export default MintScreen;