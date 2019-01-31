/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, Button} from 'react-native';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import ToggleSwitch from 'toggle-switch-react-native'

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      selectedIndex: 0,
      switchToggle: false
    };
  }

  handleIndexChange = (index) => {
    this.setState({
      ...this.state,
      selectedIndex: index
    });
  }

  onStartReporting() {
    console.log("start reporting")
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Status: <Text style={{color: 'green'}}>Connected</Text></Text>
        <Text style={styles.welcome}>Reporting Mode</Text>
        <SegmentedControlTab
          tabsContainerStyle={{marginLeft: 150, marginRight: 150}}
          values={['Voice', 'Tone', 'Beeps']}
          selectedIndex={this.state.selectedIndex}
          onTabPress={this.handleIndexChange}
        />
        <Text style={styles.welcome}>Reporting On/Off</Text>
        <ToggleSwitch
          isOn={this.state.switchToggle}
          onColor='green'
          offColor='red'
          size='large'
          onToggle={ (isOn) => this.setState({...this.state, switchToggle: isOn})}
        />
        <Text style={styles.welcome}>Automatic Reporting On/Off</Text>
        <ToggleSwitch
          isOn={this.state.switchToggle}
          onColor='green'
          offColor='red'
          size='large'
          onToggle={ (isOn) => this.setState({...this.state, switchToggle: isOn})}
        />
        <View style={{marginBottom: 50}}/>
        <Button
          onPress={this.onStartReporting}
          title="Start Reporting"
          color="green"
          accessibilityLabel="Start Reporting Altitude"
        />
        <View style={{marginBottom: 50}}/>
        <Button
          onPress={this.onCalibrate}
          title="Calibrate Sensor Module"
          color="gray"
          accessibilityLabel="Calibrate Sensor Module"
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
