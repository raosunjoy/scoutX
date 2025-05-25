import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LoginScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Login</Text>
      {/* Add login form here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontFamily: 'Inter', color: '#1E90FF', textAlign: 'center', marginBottom: 20 },
});

export default LoginScreen;