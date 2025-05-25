import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import MintScreen from './screens/MintScreen';
import FanScreen from './screens/FanScreen';
import PortfolioScreen from './screens/PortfolioScreen';
import TradeHistoryScreen from './screens/TradeHistoryScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Mint" component={MintScreen} options={{ title: 'Mint Tokens', headerStyle: { backgroundColor: '#1E90FF' }, headerTintColor: '#fff' }} />
        <Stack.Screen name="Fan" component={FanScreen} options={{ title: 'Cohort Data', headerStyle: { backgroundColor: '#1E90FF' }, headerTintColor: '#fff' }} />
        <Stack.Screen name="Portfolio" component={PortfolioScreen} options={{ title: 'Portfolio', headerStyle: { backgroundColor: '#1E90FF' }, headerTintColor: '#fff' }} />
        <Stack.Screen name="TradeHistory" component={TradeHistoryScreen} options={{ title: 'Trade History', headerStyle: { backgroundColor: '#1E90FF' }, headerTintColor: '#fff' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;