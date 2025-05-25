import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Linking, Alert, Picker } from 'react-native';
import axios from 'axios';
import WebSocket from 'react-native-websocket';
import { Web3Auth } from '@web3auth/modal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FanScreen = ({ navigation }) => {
  const [cohortId, setCohortId] = useState('');
  const [cohortData, setCohortData] = useState(null);
  const [latestPrice, setLatestPrice] = useState(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradePrice, setTradePrice] = useState('');
  const [tradeType, setTradeType] = useState('buy');
  const [walletAddress, setWalletAddress] = useState(null);
  const [web3auth, setWeb3auth] = useState(null);
  const [portfolioTotal, setPortfolioTotal] = useState(0);

  useEffect(() => {
    const initWeb3Auth = async () => {
      const web3authInstance = new Web3Auth({
        clientId: 'your_web3auth_client_id',
        network: 'testnet',
        chainConfig: {
          chainNamespace: 'solana',
          chainId: '0x1',
          rpcTarget: 'https://api.devnet.solana.com',
        },
      });
      await web3authInstance.initModal();
      setWeb3auth(web3authInstance);

      const storedWallet = await AsyncStorage.getItem('walletAddress');
      if (storedWallet) {
        setWalletAddress(storedWallet);
        fetchPortfolio(storedWallet);
      }
    };
    initWeb3Auth();
  }, []);

  const connectWallet = async () => {
    try {
      if (!web3auth) {
        Alert.alert('Error', 'Web3Auth not initialized');
        return;
      }
      await web3auth.connect();
      const provider = web3auth.provider;
      const accounts = await provider.request({ method: 'getAccounts' });
      const wallet = accounts[0];
      setWalletAddress(wallet);
      await AsyncStorage.setItem('walletAddress', wallet);
      fetchPortfolio(wallet);
    } catch (error) {
      Alert.alert('Error', 'Wallet connection failed: ' + error.message);
    }
  };

  const fetchPortfolio = async (wallet) => {
    try {
      const response = await axios.get(`http://localhost:3000/portfolio/${wallet}`);
      setPortfolioTotal(response.data.totalValue);
    } catch (error) {
      console.error('Portfolio fetch error:', error);
    }
  };

  const fetchCohortData = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/fetch-cohort-data/${cohortId}`);
      setCohortData(response.data);
      setLatestPrice(null);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch cohort data');
    }
  };

  const handleTrade = async () => {
    if (!walletAddress) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/trade-token', {
        userWallet: walletAddress,
        cohortId,
        amount: parseInt(tradeAmount),
        price: parseInt(tradePrice),
        type: tradeType,
      });
      Alert.alert('Success', `Trade executed! Transaction: ${response.data.transaction}\nFee: $${response.data.fee}`);
      setTradeAmount('');
      setTradePrice('');
      fetchPortfolio(walletAddress);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Trade failed');
    }
  };

  const handleWebSocketMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.cohortId === cohortId) {
        setLatestPrice(data.price);
      }
      if (walletAddress) {
        fetchPortfolio(walletAddress);
      }
    } catch (error) {
      console.error('WebSocket message parse error:', error);
    }
  };

  const renderHighlight = ({ item }) => (
    <Text style={styles.link} onPress={() => Linking.openURL(item.uri)}>
      Highlight: {item.data || item.uri}
    </Text>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ScoutX Fan - Cohort Data</Text>
      {walletAddress && (
        <View style={styles.portfolioSummary}>
          <Text style={styles.dataText}>Portfolio Total Value: ${portfolioTotal}</Text>
          <Button
            title="View Portfolio"
            onPress={() => navigation.navigate('Portfolio', { walletAddress })}
            color="#1E90FF"
          />
        </View>
      )}
      <TextInput
        style={styles.input}
        placeholder="Enter Cohort ID (e.g., BUCC_2026)"
        value={cohortId}
        onChangeText={setCohortId}
      />
      <Button title="Fetch Cohort Data" onPress={fetchCohortData} color="#1E90FF" />
      {walletAddress ? (
        <Text style={styles.walletText}>Wallet: {walletAddress.slice(0, 10)}...</Text>
      ) : (
        <Button title="Connect Wallet" onPress={connectWallet} color="#1E90FF" />
      )}
      {cohortData && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataText}>Cohort: {cohortData.cohortId}</Text>
          <Text style={styles.dataText}>Sport: {cohortData.sport}</Text>
          <Text style={styles.dataText}>Stats:</Text>
          {Object.entries(cohortData.stats).map(([key, value]) => (
            <Text key={key} style={styles.dataText}>
              - {key}: {value}
            </Text>
          ))}
          <Text style={styles.dataText}>Success Score: {(cohortData.successScore * 100).toFixed(2)}%</Text>
          {latestPrice !== null && (
            <Text style={styles.dataText}>Latest Price: ${latestPrice}</Text>
          )}
          <Button
            title="View Trade History"
            onPress={() => navigation.navigate('TradeHistory', { cohortId: cohortData.cohortId, tradeHistory: cohortData.tradeHistory })}
            color="#1E90FF"
          />
          <Text style={styles.dataText}>Highlights:</Text>
          <FlatList
            data={cohortData.highlights}
            renderItem={renderHighlight}
            keyExtractor={(item, index) => index.toString()}
          />
          <View style={styles.tradeContainer}>
            <Text style={styles.tradeTitle}>Initiate Trade</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount (e.g., 100)"
              value={tradeAmount}
              onChangeText={setTradeAmount}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Price (e.g., 150)"
              value={tradePrice}
              onChangeText={setTradePrice}
              keyboardType="numeric"
            />
            <Picker
              selectedValue={tradeType}
              style={styles.picker}
              onValueChange={(itemValue) => setTradeType(itemValue)}
            >
              <Picker.Item label="Buy" value="buy" />
              <Picker.Item label="Sell" value="sell" />
            </Picker>
            <Button title="Execute Trade" onPress={handleTrade} color="#1E90FF" />
          </View>
        </View>
      )}
      {cohortId && (
        <WebSocket
          url="ws://localhost:8080"
          onMessage={handleWebSocketMessage}
          onError={(error) => console.error('WebSocket error:', error)}
          reconnect
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontFamily: 'Inter', color: '#1E90FF', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  dataContainer: { marginTop: 20 },
  dataText: { fontSize: 16, marginBottom: 5 },
  link: { color: '#1E90FF', textDecorationLine: 'underline', marginBottom: 5 },
  walletText: { fontSize: 14, color: '#666', marginVertical: 10, textAlign: 'center' },
  tradeContainer: { marginTop: 20, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
  tradeTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  picker: { height: 50, width: '100%', marginBottom: 10 },
  portfolioSummary: { marginBottom: 20, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, alignItems: 'center' },
});

export default FanScreen;