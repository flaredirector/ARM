/**
 * Flare Director
 * App.js
 * Entry Point for mobile Application
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, {Component} from 'react';
import {StyleSheet, Text, View, Button} from 'react-native';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import ToggleSwitch from 'toggle-switch-react-native'
// import { Player } from 'react-native-audio-toolkit';
import {voice} from './audio_files';
import Sockets from 'react-native-sockets';
import { DeviceEventEmitter } from 'react-native';

export default class App extends Component {
  audioPlayers = new Object()

  constructor() {
    super();

    // Initialize state
    this.state = {
      selectedIndex: 0,
      reporting: false,
      automaticReporting: false,
      altitude: 0,
      lidarData: 0,
      sonarData: 0,
      connected: false,
    }

    // Handle "connected" status change
    DeviceEventEmitter.addListener('socketClient_connected', () => {
      console.log('socketClient_connected');
      this.handleConnectionStatusChange(true);
    });

    // Handle "disconnected" status change
    DeviceEventEmitter.addListener('socketClient_closed', (data) => {
      console.log('socketClient_closed',data.error);
      this.handleConnectionStatusChange(false);
      Sockets.disconnect();
    }); 

    // Handle when the socket receives a new packet
    DeviceEventEmitter.addListener('socketClient_data', (payload) => {
      let events = payload.data.split("|");

      for (event in events) {

        // Parse data and event from received packet
        let [eventString, data] = events[event].split(':');

        // Decide what to do with event and data
        this.handleEvent(eventString, data);
      }
    });

    // Handle when the socket receives an error
    DeviceEventEmitter.addListener('socketClient_error', (data) => {
      console.log('socketClient_error', data);
      Sockets.disconnect();
    });

    // Socket connection configuration
    let config = {
      address: "192.168.4.1",
      port: 4000,
      // reconnect:true,
      // reconnectDelay:5000,
    }
    
    Sockets.startClient(config);

    // Sockets.isServerAvailable(config.address, config.port, 2000, success => {
    //   console.log("SERVER AVAILABLE");
    // }, err => {
    //   console.log("SERVER NOT AVAILABLE");
    //   Sockets.disconnect();
    // });

    // Loop through audio voice files and prepare them
    // for (let file in voice) {
    //   let fileName = voice[file]
    //   this.audioPlayers[voice[file]] = new Player(fileName, {
    //     autoDestroy: false
    //   }).prepare((err) => {
    //     if (err) {
    //       console.log("Audio file prepare eror:", err)
    //     }
    //   })
    // }
  }

  // Decides what to do based on a received event and data
  handleEvent = (event, data) => {
    switch (event) {
      case "altitude":
        this.setState({altitude: data});
      case "lidarData":
        this.setState({lidarData: data});
      case "sonarData":
        this.setState({sonarData: data});
      break;
    }
  }

  // Updates state based on connection status
  handleConnectionStatusChange = (status) => {
    this.setState({connected: status});
  }

  // Handles the segmented button index change event
  handleIndexChange = (index) => {
    this.setState({
      ...this.state,
      selectedIndex: index
    });
  }

  // TODO
  onStartReporting = (isOn) => {
    setTimeout(function() {
      Sockets.write(`reportingToggle:${isOn ? "1" : "0"}`);
    }.bind(this), 3500);
    this.setState({reporting: isOn});
  }

  // Sends the "calibrate" event to the Sensor Module
  onCalibrate = () => {
    Sockets.write("calibrate:1");
  }

  // The UI rendered on screen
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.altitude}>Altitude: {this.state.altitude}cm</Text>
        <Text style={styles.welcome}>LIDAR: {this.state.lidarData}cm</Text>
        <Text style={styles.welcome}>SONAR: {this.state.sonarData}cm</Text>
        <Text style={styles.welcome}>Status: <Text style={{color: this.state.connected ? 'green' : 'red'}}>{this.state.connected ? "Connected" : "Disconnected"}</Text></Text>
        <Text style={styles.welcome}>Reporting Mode</Text>
        <SegmentedControlTab
          tabsContainerStyle={{marginLeft: 150, marginRight: 150}}
          values={['Voice', 'Tone', 'Beeps']}
          selectedIndex={this.state.selectedIndex}
          onTabPress={this.handleIndexChange}
        />
        <View style={{marginBottom: 50}}/>
        <Text style={styles.welcome}>Reporting Off/On</Text>
        <ToggleSwitch
          isOn={this.state.reporting}
          onColor='green'
          offColor='red'
          size='large'
          onToggle={this.onStartReporting}
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

// UI Styles
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
    margin: 20,
  },
  altitude: {
    fontSize: 40,
    textAlign: 'center',
    margin: 10,
  },
});
