import React, { useState } from 'react';
import { View, Text, StyleSheet, Picker } from 'react-native';

const TradeHistoryScreen = ({ route }) => {
  const { cohortId, tradeHistory } = route.params;
  const [timeRange, setTimeRange] = useState('all');

  const filterTradeHistory = () => {
    const now = new Date();
    let filteredHistory = tradeHistory;

    if (timeRange === '1day') {
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      filteredHistory = tradeHistory.filter((trade) => new Date(trade.timestamp) >= oneDayAgo);
    } else if (timeRange === '3days') {
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      filteredHistory = tradeHistory.filter((trade) => new Date(trade.timestamp) >= threeDaysAgo);
    } else if (timeRange === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredHistory = tradeHistory.filter((trade) => new Date(trade.timestamp) >= sevenDaysAgo);
    } else if (timeRange === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredHistory = tradeHistory.filter((trade) => new Date(trade.timestamp) >= thirtyDaysAgo);
    }

    if (filteredHistory.length === 0) {
      filteredHistory = tradeHistory.slice(-1);
    }

    return filteredHistory;
  };

  const filteredHistory = filterTradeHistory();
  const labels = filteredHistory.map((trade) => new Date(trade.timestamp).toLocaleDateString());
  const prices = filteredHistory.map((trade) => trade.price);
  const volumes = filteredHistory.map((trade) => trade.amount);

  const chartConfig = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Price ($)',
          data: prices,
          borderColor: '#1E90FF',
          backgroundColor: 'rgba(30, 144, 255, 0.2)',
          fill: true,
          tension: 0.3,
          yAxisID: 'y',
        },
        {
          label: 'Volume',
          data: volumes,
          type: 'bar',
          backgroundColor: 'rgba(255, 165, 0, 0.5)',
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Date' },
        },
        y: {
          title: { display: true, text: 'Price ($)' },
          beginAtZero: false,
          position: 'left',
        },
        y1: {
          title: { display: true, text: 'Volume (Tokens)' },
          beginAtZero: true,
          position: 'right',
          grid: { drawOnChartArea: false },
        },
      },
    },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{cohortId} Trade History</Text>
      <Text style={styles.subtitle}>Price and Volume Trend Over Time</Text>
      <Picker
        selectedValue={timeRange}
        style={styles.picker}
        onValueChange={(itemValue) => setTimeRange(itemValue)}
      >
        <Picker.Item label="Last 1 Day" value="1day" />
        <Picker.Item label="Last 3 Days" value="3days" />
        <Picker.Item label="Last 7 Days" value="7days" />
        <Picker.Item label="Last 30 Days" value="30days" />
        <Picker.Item label="All Time" value="all" />
      </Picker>
      ```
      chartjs
      ${JSON.stringify(chartConfig, null, 2)}
      ```
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontFamily: 'Inter', color: '#1E90FF', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 18, textAlign: 'center', marginBottom: 10 },
  picker: { height: 50, width: '100%', marginBottom: 20 },
});

export default TradeHistoryScreen;