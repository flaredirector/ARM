/**
 * Flare Director
 * App.js
 * Entry Point for mobile Application
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, Alert, ProgressBarAndroid} from 'react-native';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import * as net from'react-native-tcp';
import {NativeModules} from 'react-native';
import {voiceFiles} from './audio_files';
import Sound from 'react-native-sound';
Sound.setCategory('Playback');

// Import custom tone generator module
let ToneGenerator = NativeModules.ToneGenerator;

export default class App extends Component {
  // Class properties
  voiceFileAudioPlayers = new Object()
  client = null
  reconnectInterval = null
  simulationInterval = null
  socketConfig = {
    host: "192.168.4.1",
    port: 4000
  }
  voiceAnnunciationsReported = {
    annunciation100: false,
    annunciation50: false,
    annunciation40: false,
    annunciation30: false, 
    annunciation20: false,
    annunciation10: false,
  }

  constructor() {
    super();

    // Initialize state
    this.state = {
      selectedIndex: 0,
      reporting: false,
      altitude: 0,
      lidarData: 0,
      sonarData: 0,
      connected: false,
      isTonePlaying: false,
      battery: -1,
      calibrating: false,
      hasBeenCalibrated: false,
      dataLogging: false
    }

    // Create new socket conneciton with provided configuration
    this.client = net.createConnection(this.socketConfig, ()=> {
      console.log("Client connected");
      this.client.write("getStatus:0\0");
      // Setup event handlers and change connection status
      this.setupClientEventHandlers();
      this.handleConnectionStatusChange(true);
    });

    // Listen for socket error event
    this.client.on('error', (error) => {
      if (error.message.includes("Connection refused")) {
        console.log("Connection refused");
        this.reconnectInterval = this.startReconnectInterval();
      }
    });
   
    // Preload the voice annunciation files for faster playback
    this.preloadVoiceFiles();

    ToneGenerator.setShouldQuit(false);
    ToneGenerator.startToneLoop();
  }

  // Preloads the voice files to reduce latency when playing
  preloadVoiceFiles = () => {
    voiceFiles.forEach((filename) => {
      this.voiceFileAudioPlayers[filename] = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('Failed to preload sound file', {error,filename});
          return;
        }
      });
    });
  }

  // Sets up the socket event handlers for receiving errors and data
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

        // Fill dictionary with received sensor data
        dict[eventString] = data;

        this.handleEvent(eventString, data);
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

  // Toggle reporting
  onStartReporting = () => {
    this.client.write(`reportingToggle:${!this.state.reporting ? "1" : "0"}\0`);
  }

  // Sends the "calibrate" event to the Sensor Module
  onCalibrate = () => {
    this.setState({calibrating: true});
    this.client.write("calibrate:1\0");
  }

  // Toggle data logging
  toggleDataLogging = () => {
    this.client.write(`loggingToggle:${this.state.dataLogging ? "0" : "1"}\0`);
  }

  // Conversion from cm to feet
  toFeet = (cm) => {
    return Math.round(cm / 30.48); 
  }

  // Conversion from feet to cm
  toCm = (feet) => {
    return Math.round(feet * 30.48);
  }

  // Handles incoming event from the ASM
  handleEvent = (event, data) => {
    if (event === "altitude") {
      if (data > this.toCm(115)) {
        Object.keys(this.voiceAnnunciationsReported).forEach((key) => {
          this.voiceAnnunciationsReported[key] = false;
        });
      }

      // Voice annunciations selected
      if (this.state.selectedIndex == 0) {
        ToneGenerator.setIsPlaying(false);
        let alt = null;
        if (data < this.toCm(85) && data > this.toCm(75))
          alt = 80; 
        else if (data < this.toCm(55) && data > this.toCm(45))
          alt = 50;
        else if (data < this.toCm(45) && data > this.toCm(35))
          alt = 40;
        else if (data < this.toCm(35) && data > this.toCm(25))
          alt = 30;
        else if (data < this.toCm(25) && data > this.toCm(15))
          alt = 20;
        else if (data < this.toCm(12) && data > this.toCm(8))
          alt = 10;
        else if (data < this.toCm(3) && data > this.toCm(7))
          alt = 5;
        if (alt) {
          if (!this.voiceAnnunciationsReported[`annunciation${alt}`]) {
            this.voiceFileAudioPlayers[`callout_${alt}.mp3`].play((success) => {
              if (success) {
                console.log('Done playing voice file')
              } else {
                console.log('Voice file playback failed');
              }
            });
            this.voiceAnnunciationsReported[`annunciation${alt}`] = true;
          }
        }
      } else if (this.state.selectedIndex == 1) {
        ToneGenerator.setIsPlaying(true);
        ToneGenerator.setDelay(Math.round(this.toFeet(data)*4.16)+50);
      }

    } else if (event === "reportingStatus") {
      this.setState({reporting: (Number(data) == 1) ? true : false});
      ToneGenerator.setIsPlaying(this.state.reporting);

    } else if (event === "calibrationStatus") {
      this.setState({calibrating: false});
      if (data == 1) {
        this.setState({hasBeenCalibrated: false});
        return;
      } else if (data == 0) {
        this.setState({hasBeenCalibrated: true})
        return;
      }
      this.setState({calibrating: false});
      let title = "Calibration Error", message = "Calibration Successful";
      if (data == -1) {
        message = "The maximum allowable offset has been exceded.";
        this.setState({hasBeenCalibrated: false})
      } else if (data == -2) {
        message = "The sensors have failed or are not responding.";
        this.setState({hasBeenCalibrated: false})
      }
      Alert.alert(
        title,
        message,
        [
          {text: 'OK', onPress: () => console.log('OK Pressed')},
        ],
        {cancelable: false},
      );

    } else if (event === "batteryStatus") {
      this.setState({battery: data});

    } else if (event === "loggingStatus") {
      this.setState({dataLogging: (Number(data) == 1) ? true : false})
    }
  }

  startLandingSimulation = () => {
    if (this.simulationInterval) {
      ToneGenerator.setIsPlaying(false);
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    } else {
      ToneGenerator.setShouldQuit(false);
      ToneGenerator.startToneLoop();
      this.simulationInterval = setInterval(() => {
        this.setState({altitude: this.state.altitude-1});
        if (this.state.altitude < 0) {
          this.setState({altitude: 120});
          Object.keys(this.voiceAnnunciationsReported).forEach((key) => {
            this.voiceAnnunciationsReported[key] = false;
          });
        }
        this.handleEvent("altitude", this.state.altitude);
      }, 100);
    }  
  }

  renderCalibrateButton = () => {
    if (this.state.calibrating) {
      return (<>
      <ProgressBarAndroid
        styleAttr="Normal"
      />
      </>)
    } else {
      return (<Button
        onPress={this.onCalibrate}
        title="Calibrate Sensor Module"
        color="gray"
        accessibilityLabel="Calibrate Sensor Module"
      />)
    }
  }

  // The UI rendered on screen
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.altitude}>Altitude: {this.state.altitude} cm, {this.toFeet(this.state.altitude)} feet</Text>
        <Text style={styles.welcome}>LIDAR: {this.state.lidarData} cm, {this.toFeet(this.state.lidarData)} feet</Text>
        <Text style={styles.welcome}>SONAR: {this.state.sonarData} cm, {this.toFeet(this.state.sonarData)} feet</Text>
        <Text style={styles.welcome}>Status: <Text style={{color: this.state.connected ? 'green' : 'red'}}>{this.state.connected ? "Connected" : "Disconnected"}</Text></Text>
        <Text style={styles.welcome}>Reporting Mode</Text>
        <SegmentedControlTab
          tabsContainerStyle={{marginLeft: 150, marginRight: 150}}
          values={['Voice', 'Beeps']}
          selectedIndex={this.state.selectedIndex}
          onTabPress={this.handleIndexChange}
        />
        <View style={{marginBottom: 50}}/>
        <Button
          onPress={this.onStartReporting}
          title={`Turn ${this.state.reporting ? "OFF" : "ON"} Reporting`}
          color={this.state.reporting ? "red" : "green"}
          accessibilityLabel="Reporting toggle."
        />
        <View style={{marginBottom: 10}}/>
        <Text style={styles.welcome}>
          {(this.state.battery != -1) ? 
            `Battery: ${this.state.battery} %` : 
            'Battery Status Unavailable'}
        </Text>
        {(this.state.battery != -1) ? 
          <ProgressBarAndroid
            styleAttr="Horizontal"
            indeterminate={false}
            progress={this.state.battery / 100}
            style={{width: 200}}
          />
          : null
        }
        
        <View style={{marginBottom: 30}}/>
        {(this.state.calibrating ?
          <ProgressBarAndroid styleAttr="Normal"/>
          :
          <>
          <Button
            onPress={this.onCalibrate}
            title="Calibrate Sensor Module"
            color="gray"
            accessibilityLabel="Calibrate Sensor Module"
          />
          <Text style={{...styles.welcome, color: this.state.hasBeenCalibrated ? "green" : "red"}}>{this.state.hasBeenCalibrated ? "Calibrated" : "Not Calibrated"}</Text>
        </>)}
        <View style={{marginBottom: 20}}/>
        <Button
          onPress={this.toggleDataLogging}
          title={`Turn ${this.state.dataLogging ? "OFF" : "ON"} Data Logging`}
          color={this.state.dataLogging ? "red" : "green"}
          accessibilityLabel="Toggle data logging"
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
    fontSize: 25,
    textAlign: 'center',
    margin: 20,
  },
  altitude: {
    fontSize: 40,
    textAlign: 'center',
    margin: 10,
  },
});
