import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ScoutX</Text>
      <Button
        title="Admin Login (Mint Tokens)"
        onPress={() => navigation.navigate('Login')}
        color="#1E90FF"
      />
      <View style={styles.spacing} />
      <Button
        title="Fan View (Cohort Data)"
        onPress={() => navigation.navigate('Fan')}
        color="#1E90FF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontFamily: 'Inter', color: '#1E90FF', textAlign: 'center', marginBottom: 20 },
  spacing: { marginVertical: 10 },
});

export default HomeScreen;