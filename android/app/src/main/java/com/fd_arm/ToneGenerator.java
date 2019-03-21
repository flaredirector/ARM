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
	public void playSound(final int freqHz, final int durationMs)
	{
		Thread playerThread = new Thread() {
			public void run() {
				int count = (int)(44100.0 * 2.0 * (durationMs / 1000.0)) & ~1;
				short[] samples = new short[count];
				for(int i = 0; i < count; i += 2){
				short sample = (short)(Math.sin(2 * Math.PI * i / (44100.0 / freqHz)) * 0x7FFF);
				samples[i + 0] = sample;
				samples[i + 1] = sample;
				}
				AudioTrack track = new AudioTrack(AudioManager.STREAM_MUSIC, 44100,
					AudioFormat.CHANNEL_OUT_STEREO, AudioFormat.ENCODING_PCM_16BIT,
					count * (Short.SIZE / 8), AudioTrack.MODE_STREAM);
				while (!shouldQuit) {
					try {
						sleep(delay);
					} catch (InterruptedException e) {
						Log.d("INTERRUPTED EXCEPTION", "INTERRUPTED EXCEPTION");
					}
					if (isPlaying) {
						track.write(samples, 0, count);
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