import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Linking, Alert, Picker, TouchableOpacity } from 'react-native';
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
  const [players, setPlayers] = useState([]);
  const [swotData, setSwotData] = useState({});
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [trendsData, setTrendsData] = useState({});
  const [academyRankings, setAcademyRankings] = useState([]);

  useEffect(() => {
    const initWeb3Auth = async () => {
      const web3authInstance = new Web3Auth({
        clientId: process.env.WEB3AUTH_CLIENT_ID || 'your_web3auth_client_id',
        network: 'mainnet',
        chainConfig: {
          chainNamespace: 'solana',
          chainId: '0x1',
          rpcTarget: 'https://api.mainnet-beta.solana.com',
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
      const response = await axios.get(`http://localhost:3000/cohort/data/${cohortId}`);
      setCohortData(response.data);
      setLatestPrice(null);

      const playersResponse = await axios.get(`http://localhost:3000/cohort/players/${cohortId}`);
      setPlayers(playersResponse.data);
      if (playersResponse.data.length > 0) {
        setPlayer1(playersResponse.data[0].name);
        setPlayer2(playersResponse.data.length > 1 ? playersResponse.data[1].name : '');
      }

      const rankingsResponse = await axios.get(`http://localhost:3000/cohort/academy-rankings/${cohortId}`);
      setAcademyRankings(rankingsResponse.data);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch cohort data');
    }
  };

  const fetchSWOT = async (playerName) => {
    try {
      const response = await axios.get(`http://localhost:3000/cohort/swot/${cohortId}/${playerName}`);
      setSwotData((prev) => ({ ...prev, [playerName]: response.data }));
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch SWOT analysis: ' + error.response?.data?.message);
    }
  };

  const fetchComparison = async () => {
    if (!player1 || !player2 || player1 === player2) {
      Alert.alert('Error', 'Please select two different players to compare');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3000/cohort/compare-players/${cohortId}`, {
        params: { player1, player2 },
      });
      setComparisonData(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch comparison: ' + error.response?.data?.message);
    }
  };

  const fetchPerformanceTrends = async (playerName) => {
    try {
      const response = await axios.get(`http://localhost:3000/cohort/performance-trends/${cohortId}/${playerName}`);
      setTrendsData((prev) => ({ ...prev, [playerName]: response.data }));
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch performance trends: ' + error.response?.data?.message);
    }
  };

  const toggleSWOT = (playerName) => {
    if (!swotData[playerName]) {
      fetchSWOT(playerName);
    } else {
      setSwotData((prev) => {
        const newData = { ...prev };
        delete newData[playerName];
        return newData;
      });
    }
  };

  const toggleTrends = (playerName) => {
    if (!trendsData[playerName]) {
      fetchPerformanceTrends(playerName);
    } else {
      setTrendsData((prev) => {
        const newData = { ...prev };
        delete newData[playerName];
        return newData;
      });
    }
  };

  const handleTrade = async () => {
    if (!walletAddress) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/trade/token', {
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

  const renderTrends = (playerName) => {
    const trends = trendsData[playerName];
    if (!trends) return null;

    const datasets = [];
    const colors = ['#FF6347', '#4682B4', '#32CD32'];
    let colorIndex = 0;

    Object.entries(trends).forEach(([academy, data]) => {
      const color = colors[colorIndex % colors.length];
      colorIndex++;

      Object.entries(data.stats).forEach(([stat, values]) => {
        datasets.push({
          label: `${academy} - ${stat}`,
          data: values,
          borderColor: color,
          borderDash: [5, 5],
          fill: false,
          yAxisID: 'y',
        });
      });

      datasets.push({
        label: `${academy} - Success Score`,
        data: data.successScores,
        borderColor: color,
        fill: false,
        yAxisID: 'y1',
      });
    });

    const allTimestamps = Object.values(trends)
      .flatMap((data) => data.timestamps)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const chartConfig = {
      type: 'line',
      data: {
        labels: allTimestamps,
        datasets: datasets,
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: { display: true, text: 'Date' },
          },
          y: {
            title: { display: true, text: 'Stats' },
            position: 'left',
            beginAtZero: false,
          },
          y1: {
            title: { display: true, text: 'Success Score (%)' },
            position: 'right',
            min: 0,
            max: 100,
            grid: { drawOnChartArea: false },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
      },
    };

    return (
      <View style={styles.trendsContainer}>
        <Text style={styles.trendsTitle}>Performance Trends by Academy</Text>
        ```
        chartjs
        ${JSON.stringify(chartConfig, null, 2)}
        ```
      </View>
    );
  };

  const renderPlayer = ({ item }) => {
    const swot = swotData[item.name];
    const trends = trendsData[item.name];
    return (
      <View style={styles.playerContainer}>
        <TouchableOpacity onPress={() => toggleSWOT(item.name)}>
          <Text style={styles.playerName}>{item.name}</Text>
        </TouchableOpacity>
        {swot && (
          <View style={styles.swotContainer}>
            <Text style={styles.swotTitle}>Strengths:</Text>
            {swot.strengths.map((s, idx) => (
              <Text key={idx} style={styles.swotText}>- {s}</Text>
            ))}
            <Text style={styles.swotTitle}>Weaknesses:</Text>
            {swot.weaknesses.map((w, idx) => (
              <Text key={idx} style={styles.swotText}>- {w}</Text>
            ))}
            <Text style={styles.swotTitle}>Opportunities:</Text>
            {swot.opportunities.map((o, idx) => (
              <Text key={idx} style={styles.swotText}>- {o}</Text>
            ))}
            <Text style={styles.swotTitle}>Threats:</Text>
            {swot.threats.map((t, idx) => (
              <Text key={idx} style={styles.swotText}>- {t}</Text>
            ))}
          </View>
        )}
        <TouchableOpacity onPress={() => toggleTrends(item.name)}>
          <Text style={styles.trendsToggle}>
            {trends ? 'Hide Performance Trends' : 'Show Performance Trends'}
          </Text>
        </TouchableOpacity>
        {renderTrends(item.name)}
      </View>
    );
  };

  const renderComparison = () => {
    if (!comparisonData) return null;

    const { stats, successScore, swot } = comparisonData;
    const player1Name = player1;
    const player2Name = player2;

    return (
      <View style={styles.comparisonContainer}>
        <Text style={styles.comparisonTitle}>Player Comparison</Text>
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonHeader}>{player1Name}</Text>
          <Text style={styles.comparisonHeader}>{player2Name}</Text>
        </View>

        <Text style={styles.comparisonSubtitle}>Stats:</Text>
        {Object.entries(stats).map(([stat, data]) => (
          <View key={stat} style={styles.comparisonRow}>
            <Text style={styles.comparisonText}>{stat}: {data[player1Name]}</Text>
            <Text style={styles.comparisonText}>{stat}: {data[player2Name]}</Text>
            <Text style={styles.comparisonDiff}>{data.difference}</Text>
          </View>
        ))}

        <Text style={styles.comparisonSubtitle}>Success Score:</Text>
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonText}>{successScore[player1Name]}</Text>
          <Text style={styles.comparisonText}>{successScore[player2Name]}</Text>
          <Text style={styles.comparisonDiff}>{successScore.difference}</Text>
        </View>

        <Text style={styles.comparisonSubtitle}>SWOT Analysis:</Text>
        <View style={styles.comparisonRow}>
          <View style={styles.swotColumn}>
            <Text style={styles.swotTitle}>Strengths ({player1Name}):</Text>
            {swot[player1Name].strengths.map((s, idx) => (
              <Text key={idx} style={styles.swotText}>- {s}</Text>
            ))}
            <Text style={styles.swotTitle}>Weaknesses:</Text>
            {swot[player1Name].weaknesses.map((w, idx) => (
              <Text key={idx} style={styles.swotText}>- {w}</Text>
            ))}
            <Text style={styles.swotTitle}>Opportunities:</Text>
            {swot[player1Name].opportunities.map((o, idx) => (
              <Text key={idx} style={styles.swotText}>- {o}</Text>
            ))}
            <Text style={styles.swotTitle}>Threats:</Text>
            {swot[player1Name].threats.map((t, idx) => (
              <Text key={idx} style={styles.swotText}>- {t}</Text>
            ))}
          </View>
          <View style={styles.swotColumn}>
            <Text style={styles.swotTitle}>Strengths ({player2Name}):</Text>
            {swot[player2Name].strengths.map((s, idx) => (
              <Text key={idx} style={styles.swotText}>- {s}</Text>
            ))}
            <Text style={styles.swotTitle}>Weaknesses:</Text>
            {swot[player2Name].weaknesses.map((w, idx) => (
              <Text key={idx} style={styles.swotText}>- {w}</Text>
            ))}
            <Text style={styles.swotTitle}>Opportunities:</Text>
            {swot[player2Name].opportunities.map((o, idx) => (
              <Text key={idx} style={styles.swotText}>- {o}</Text>
            ))}
            <Text style={styles.swotTitle}>Threats:</Text>
            {swot[player2Name].threats.map((t, idx) => (
              <Text key={idx} style={styles.swotText}>- {t}</Text>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderAcademyRankings = () => {
    if (academyRankings.length === 0) return null;

    return (
      <View style={styles.rankingsContainer}>
        <Text style={styles.rankingsTitle}>Academy Performance Rankings</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Rank</Text>
          <Text style={styles.tableHeaderText}>Academy</Text>
          <Text style={styles.tableHeaderText}>Avg Batting</Text>
          <Text style={styles.tableHeaderText}>Avg Success</Text>
          <Text style={styles.tableHeaderText}>Score</Text>
        </View>
        {academyRankings.map((ranking, index) => (
          <View key={ranking.academy} style={styles.tableRow}>
            <Text style={styles.tableCell}>{index + 1}</Text>
            <Text style={styles.tableCell}>{ranking.academy}</Text>
            <Text style={styles.tableCell}>{ranking.avgStats.battingAverage.toFixed(2)}</Text>
            <Text style={styles.tableCell}>{ranking.avgSuccessScore}%</Text>
            <Text style={styles.tableCell}>{ranking.compositeScore}</Text>
          </View>
        ))}
      </View>
    );
  };

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
        placeholder="Enter Cohort ID (e.g., TEST_2026)"
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
          {renderAcademyRankings()}
          <Text style={styles.dataText}>Players:</Text>
          <FlatList
            data={players}
            renderItem={renderPlayer}
            keyExtractor={(item) => item.name}
          />
          {players.length > 1 && (
            <View style={styles.comparisonSection}>
              <Text style={styles.comparisonTitle}>Compare Players</Text>
              <View style={styles.pickerRow}>
                <Picker
                  selectedValue={player1}
                  style={styles.pickerHalf}
                  onValueChange={(itemValue) => setPlayer1(itemValue)}
                >
                  {players.map((p) => (
                    <Picker.Item key={p.name} label={p.name} value={p.name} />
                  ))}
                </Picker>
                <Picker
                  selectedValue={player2}
                  style={styles.pickerHalf}
                  onValueChange={(itemValue) => setPlayer2(itemValue)}
                >
                  {players.map((p) => (
                    <Picker.Item key={p.name} label={p.name} value={p.name} />
                  ))}
                </Picker>
              </View>
              <Button title="Compare" onPress={fetchComparison} color="#1E90FF" />
              {renderComparison()}
            </View>
          )}
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
  playerContainer: { marginBottom: 10, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
  playerName: { fontSize: 16, fontWeight: 'bold', color: '#1E90FF' },
  swotContainer: { marginTop: 10, padding: 10, backgroundColor: '#fff', borderRadius: 5 },
  swotColumn: { flex: 1, padding: 5 },
  swotTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 5 },
  swotText: { fontSize: 14, marginLeft: 10 },
  trendsContainer: { marginTop: 10, padding: 10, backgroundColor: '#fff', borderRadius: 5 },
  trendsTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  trendsToggle: { fontSize: 14, color: '#1E90FF', marginTop: 10 },
  comparisonSection: { marginTop: 20, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
  comparisonContainer: { marginTop: 10 },
  comparisonTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  comparisonSubtitle: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  comparisonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  comparisonHeader: { fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  comparisonText: { fontSize: 14, flex: 1, textAlign: 'center' },
  comparisonDiff: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 2 },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  pickerHalf: { height: 50, width: '48%' },
  rankingsContainer: { marginTop: 20, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
  rankingsTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1E90FF', padding: 5, borderRadius: 5 },
  tableHeaderText: { flex: 1, color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  tableRow: { flexDirection: 'row', padding: 5, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  tableCell: { flex: 1, textAlign: 'center', fontSize: 14 },
});

export default FanScreen;