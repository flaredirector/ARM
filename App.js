/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, {Component} from 'react';
import {StyleSheet, Text, View, Button} from 'react-native';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import ToggleSwitch from 'toggle-switch-react-native'
// import {
//   Player
// } from 'react-native-audio-toolkit';
import {voice} from './audio_files';
import Sockets from 'react-native-sockets';
import { DeviceEventEmitter } from 'react-native';

export default class App extends Component {
  audioPlayers = new Object()

  constructor() {
    super();
    this.state = {
      selectedIndex: 0,
      reporting: false,
      automaticReporting: false,
      altitude: 120,
      connected: false
    }

    DeviceEventEmitter.addListener('socketClient_connected', () => {
      console.log('socketClient_connected');
      this.handleConnectionStatusChange(true);
    });

    DeviceEventEmitter.addListener('socketClient_closed', (data) => {
      console.log('socketClient_closed',data.error);
      this.handleConnectionStatusChange(false);
    });

    DeviceEventEmitter.addListener('socketClient_data', (payload) => {
      //console.log('socketClient_data message:', payload.data);
      let [event, data] = payload.data.split(':');
      this.setState({altitude: data});
    });

    DeviceEventEmitter.addListener('socketClient_error', (data) => {
      console.log('socketClient_error',data.error);
    });

    let config = {
      address: "192.168.4.1", //ip address of server
      port: 4000,
      // reconnect:true,
      // reconnectDelay:1000,
      // maxReconnectAttempts:10,
    }
    
    Sockets.startClient(config);

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

  handleConnectionStatusChange = (status) => {
    this.setState({connected: status});
  }

  handleIndexChange = (index) => {
    this.setState({
      ...this.state,
      selectedIndex: index
    });
  }

  onStartReporting = () => {
    this.state.altitude = 120;
    let interval = setInterval(()=> {
      // Voice
      // if (this.state.selectedIndex == 0) {
      //   if ((this.state.altitude % 10) == 0 && ((this.state.altitude <=50 && this.state.altitude > 0) || this.state.altitude == 100)) {
      //     this.audioPlayers["voice_" + this.state.altitude + "ft.mp3"].play()
      //   }

      // // Beeps
      // } else if (this.state.selectedIndex == 2) {

      // }
      
      if (this.state.altitude > 0) {
        this.setState({altitude: this.state.altitude - 1});
      } else {
        clearInterval(interval);
      } 
    }, 100);
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.altitude}>Altitude: {this.state.altitude}ft</Text>
        <Text style={styles.welcome}>Status: <Text style={{color: this.state.connected ? 'green' : 'red'}}>{this.state.connected ? "Connected" : "Disconnected"}</Text></Text>
        <Text style={styles.welcome}>Reporting Mode</Text>
        <SegmentedControlTab
          tabsContainerStyle={{marginLeft: 150, marginRight: 150}}
          values={['Voice', 'Tone', 'Beeps']}
          selectedIndex={this.state.selectedIndex}
          onTabPress={this.handleIndexChange}
        />
        <Text style={styles.welcome}>Reporting On/Off</Text>
        <ToggleSwitch
          isOn={this.state.reporting}
          onColor='green'
          offColor='red'
          size='large'
          onToggle={ (isOn) => this.setState({...this.state, reporting: isOn})}
        />
        <Text style={styles.welcome}>Automatic Reporting On/Off</Text>
        <ToggleSwitch
          isOn={this.state.automaticReporting}
          onColor='green'
          offColor='red'
          size='large'
          onToggle={ (isOn) => this.setState({...this.state, automaticReporting: isOn})}
        />
        <View style={{marginBottom: 50}}/>
        <Button
          onPress={this.onStartReporting}
          title="Start Reporting (Demonstration)"
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
  altitude: {
    fontSize: 40,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
