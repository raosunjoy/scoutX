import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import axios from 'axios';
import WebSocket from 'react-native-websocket';

const PortfolioScreen = ({ route }) => {
  const { walletAddress } = route.params;
  const [portfolio, setPortfolio] = useState({ holdings: [], totalValue: 0 });

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/portfolio/${walletAddress}`);
      setPortfolio(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch portfolio');
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleWebSocketMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const updatedHoldings = portfolio.holdings.map((holding) => {
        if (holding.cohortId === data.cohortId) {
          return { ...holding, latestPrice: data.price, value: holding.amount * data.price };
        }
        return holding;
      });
      setPortfolio({
        ...portfolio,
        holdings: updatedHoldings,
        totalValue: updatedHoldings.reduce((sum, h) => sum + h.value, 0),
      });
    } catch (error) {
      console.error('WebSocket message parse error:', error);
    }
  };

  const renderHolding = ({ item }) => (
    <View style={styles.holdingItem}>
      <Text style={styles.dataText}>Cohort: {item.cohortId}</Text>
      <Text style={styles.dataText}>Tokens: {item.amount}</Text>
      <Text style={styles.dataText}>Price: ${item.latestPrice}</Text>
      <Text style={styles.dataText}>Value: ${item.value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Portfolio</Text>
      <Text style={styles.totalValue}>Total Value: ${portfolio.totalValue}</Text>
      <FlatList
        data={portfolio.holdings}
        renderItem={renderHolding}
        keyExtractor={(item) => item.cohortId}
        ListEmptyComponent={<Text style={styles.dataText}>No holdings yet.</Text>}
      />
      <WebSocket
        url="ws://localhost:8080"
        onMessage={handleWebSocketMessage}
        onError={(error) => console.error('WebSocket error:', error)}
        reconnect
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontFamily: 'Inter', color: '#1E90FF', textAlign: 'center', marginBottom: 20 },
  totalValue: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  holdingItem: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 10 },
  dataText: { fontSize: 16, marginBottom: 5 },
});

export default PortfolioScreen;