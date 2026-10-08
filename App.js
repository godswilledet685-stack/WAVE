import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';

export default function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [playing, setPlaying] = useState(false);

  async function startRecording() {
    try {
      const permission =
        await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'Allow microphone access to record voice notes.'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const result =
        await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

      setRecording(result.recording);
      Alert.alert('WAVE', 'Recording started!');
    } catch (error) {
      Alert.alert(
        'Recording error',
        'Could not start recording.'
      );
    }
  }

  async function stopRecording() {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();

      setAudioUri(uri);
      setRecording(null);

      setMessages(previous => [
        ...previous,
        {
          id: Date.now().toString(),
          type: 'voice',
          uri,
          text: 'Voice note',
        },
      ]);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      Alert.alert(
        'WAVE',
        'Voice note saved on this device!'
      );
    } catch (error) {
      setRecording(null);
      Alert.alert(
        'Error',
        'Could not save the recording.'
      );
    }
  }

  async function playVoiceNote(uri) {
    try {
      setPlaying(true);

      const result = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      result.sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          setPlaying(false);
          result.sound.unloadAsync();
        }
      });
    } catch (error) {
      setPlaying(false);
      Alert.alert(
        'Playback error',
        'Could not play this voice note.'
      );
    }
  }

  function sendMessage() {
    if (!message.trim()) return;

    setMessages(previous => [
      ...previous,
      {
        id: Date.now().toString(),
        type: 'text',
        text: message.trim(),
      },
    ]);

    setMessage('');
  }

  function renderMessage({ item }) {
    return (
      <View style={styles.bubble}>
        {item.type === 'voice' ? (
          <TouchableOpacity
            onPress={() => playVoiceNote(item.uri)}
          >
            <Text style={styles.voiceText}>
              ▶  Play voice note
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.messageText}>
            {item.text}
          </Text>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.logo}>WAVE</Text>
        <Text style={styles.subtitle}>
          Connect. Chat. Share.
        </Text>
      </View>

      <View style={styles.chatHeader}>
        <Text style={styles.chatTitle}>
          My Messages
        </Text>
        <Text style={styles.online}>
          ● Ready to chat
        </Text>
      </View>

      <FlatList
        style={styles.messages}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Welcome to WAVE!
            {'\n\n'}
            Your conversations will appear here.
          </Text>
        }
      />

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Write a message..."
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
        />

        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
        >
          <Text style={styles.buttonText}>
            Send
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.voiceArea}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            recording && styles.stopButton,
          ]}
          onPress={
            recording
              ? stopRecording
              : startRecording
          }
        >
          <Text style={styles.buttonText}>
            {recording
              ? '■ Stop Recording'
              : '🎤 Record Voice Note'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        WAVE © Your world, your conversations.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071522',
  },

  header: {
    padding: 24,
    backgroundColor: '#102B40',
  },

  logo: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#39D5C5',
  },

  subtitle: {
    color: '#FFFFFF',
    marginTop: 5,
  },

  chatHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#263B4A',
  },

  chatTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },

  online: {
    color: '#39D5C5',
    marginTop: 5,
  },

  messages: {
    flex: 1,
    padding: 15,
  },

  empty: {
    color: '#AAB8C4',
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
    lineHeight: 25,
  },

  bubble: {
    backgroundColor: '#17374A',
    padding: 13,
    marginVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },

  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
  },

  voiceText: {
    color: '#39D5C5',
    fontSize: 16,
    fontWeight: 'bold',
  },

  inputArea: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },

  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },

  sendButton: {
    backgroundColor: '#168F86',
    padding: 13,
    borderRadius: 25,
    marginLeft: 8,
  },

  voiceArea: {
    paddingHorizontal: 15,
    paddingBottom: 12,
  },

  recordButton: {
    backgroundColor: '#168F86',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  stopButton: {
    backgroundColor: '#C62828',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },

  footer: {
    color: '#8395A3',
    textAlign: 'center',
    fontSize: 11,
    paddingBottom: 10,
  },
});
