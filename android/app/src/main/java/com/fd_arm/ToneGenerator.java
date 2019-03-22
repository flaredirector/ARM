// ToneGeneratorModule.java

package com.fd_arm;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import android.media.AudioManager;
import android.media.AudioTrack;
import android.media.AudioFormat;

import java.util.concurrent.TimeUnit;
import android.util.Log;

public class ToneGenerator extends ReactContextBaseJavaModule {

	public int delay = 500;
	public boolean isPlaying = false;
	public boolean shouldQuit = false;

	@ReactMethod
	public void startToneLoop()
	{
		Thread playerThread = new Thread() {
			public void run() {
				double duration = 80;            // milliseconds
				double freqOfTone = 500;       // hz
				int sampleRate = 8000;          // a number

				double dnumSamples = (duration/1000) * sampleRate;
				dnumSamples = Math.ceil(dnumSamples);
				int numSamples = (int) dnumSamples;
				double sample[] = new double[numSamples];
				byte generatedSnd[] = new byte[2 * numSamples];

				for (int i = 0; i < numSamples; ++i) {
					sample[i] = Math.sin(freqOfTone * 2 * Math.PI * i / (sampleRate));
				}

				int idx = 0;
				int i = 0 ;

				int ramp = numSamples / 20 ;

				for (i = 0; i< ramp; ++i) {
					double dVal = sample[i];
					final short val = (short) ((dVal * 32767 * i/ramp));
					generatedSnd[idx++] = (byte) (val & 0x00ff);
					generatedSnd[idx++] = (byte) ((val & 0xff00) >>> 8);
				}

				for (i = i; i< numSamples - ramp; ++i) {
					double dVal = sample[i];
					final short val = (short) ((dVal * 32767));
					generatedSnd[idx++] = (byte) (val & 0x00ff);
					generatedSnd[idx++] = (byte) ((val & 0xff00) >>> 8);
				}

				for (i = i; i< numSamples; ++i) {
					double dVal = sample[i];
					final short val = (short) ((dVal * 32767 * (numSamples-i)/ramp ));
					generatedSnd[idx++] = (byte) (val & 0x00ff);
					generatedSnd[idx++] = (byte) ((val & 0xff00) >>> 8);
				}

				AudioTrack track = new AudioTrack(AudioManager.STREAM_MUSIC,
				sampleRate, AudioFormat.CHANNEL_CONFIGURATION_MONO,
				AudioFormat.ENCODING_PCM_16BIT, (int)numSamples*2,
				AudioTrack.MODE_STREAM);
				while (!shouldQuit) {
					try {
						sleep(delay);
					} catch (InterruptedException e) {
						Log.d("INTERRUPTED EXCEPTION", "INTERRUPTED EXCEPTION");
					}
					if (isPlaying) {
						track.write(generatedSnd, 0, generatedSnd.length);
						track.play();
					}
				}
				track.release();
			}
		};
		playerThread.start();
	}

	@ReactMethod
	public void setDelay(int delayMs) {
		this.delay = delayMs;
	}

	@ReactMethod
	public void setIsPlaying(boolean playing) {
		this.isPlaying = playing;
	}

	@ReactMethod
	public void setShouldQuit(boolean quit) {
		this.shouldQuit = quit;
	}

	public ToneGenerator(ReactApplicationContext reactContext) {
		super(reactContext);
	}

	@Override
	public String getName() {
		return "ToneGenerator";
	}
}