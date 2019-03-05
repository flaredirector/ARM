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
import * as net from'react-native-tcp';

export default class App extends Component {
  audioPlayers = new Object()
  client = null
  reconnectInterval = null

  // Socket connection configuration
  socketConfig = {
    host: "192.168.4.1",
    port: 4000
  }

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

    // Create new socket conneciton with provided configuration
    this.client = net.createConnection(this.socketConfig, ()=> {
      console.log("Client connected");
      this.setupClientEventHandlers();
      this.handleConnectionStatusChange(true);
    });

    this.client.on('error', (error) => {
      if (error.message.includes("Connection refused")) {
        console.log("Connection refused");
        this.reconnectInterval = this.startReconnectInterval();
      }
    });

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

  setupClientEventHandlers = () => {
    // Handle socket error
    this.client.on('error', function(error) {
      console.log(error);
    });

    this.client.on('data', (data) => {
      // Convert from ASCII UINT8 array to string
      let payloadData = String.fromCharCode.apply(null, data);

      // Trim last character '\4' from payload data string
      payloadData = payloadData.slice(0, -1);

      // Get each event in payload
      let events = payloadData.split("|");

      // Create empty dictionary
      let dict = {};

      // Parse each event and handle it
      for (event in events) {
        // Parse data and event from received packet
        let [eventString, data] = events[event].split(':');

        // Decide what to do with event and data
        // this.handleEvent(eventString, data);

        // Fill dictionary with received sensor data
        dict[eventString] = data;
      }

      // Update the UI
      this.setState(dict);
    });

    // Handle socket close event
    this.client.on('close', () => {
      console.log("Client closed connection");
      this.handleConnectionStatusChange(false);
      this.reconnectInterval = this.startReconnectInterval();
    });
  }

  // Starts the reconnect interval for the TCP socket; attempts
  // reconnect every 5 seconds
  startReconnectInterval = () => {
    // Return interval object
    return setInterval(()=> {
      console.log("Trying to reconnect...");
      // Make sure existing client is nullified
      this.client = null;

      // Attempt to create new client
      this.client = net.createConnection(this.socketConfig, ()=> {
        console.log("Client reconnected!");
        // Setup event handlers and change connection state
        this.setupClientEventHandlers();
        this.handleConnectionStatusChange(true);

        // Clear and nullify the interval
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null
      });

      // Set error handler; needed to prevent crash
      this.client.on('error', (error) => {
        if (error.message.includes("Connection refused")) {
          console.log("Reconnection failed");
        }
      });
    }, 5000);
  }

  // Decides what to do based on a received event and data
  handleEvent = (event, data) => {
    switch (event) {
      
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
    this.setState({reporting: isOn});
    this.client.write(`reportingToggle:${isOn ? "1" : "0"}`);
  }

  // Sends the "calibrate" event to the Sensor Module
  onCalibrate = () => {
    this.client.write("calibrate:1");
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
