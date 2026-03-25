import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: 'Waiting for evidence payload...', isSystem: true },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), text: message, isSystem: false }]);
    setMessage('');
    
    // Simulate anchoring response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now().toString() + 'sys', 
        text: `✅ Evidence Anchored\nHash: ${Math.random().toString(16).substring(2, 10)}...`, 
        isSystem: true 
      }]);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Evidence Case #{id}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
          {messages.map(msg => (
            <View 
              key={msg.id} 
              style={[
                styles.messageBubble, 
                msg.isSystem ? styles.systemBubble : styles.userBubble
              ]}
            >
              <Text style={[styles.messageText, msg.isSystem && styles.systemText]}>
                {msg.text}
              </Text>
              {!msg.isSystem && <Text style={styles.readReceipt}>🟢 12:45</Text>}
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachButton}>
            <Text style={styles.attachIcon}>📸</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type note to anchor..."
            placeholderTextColor="#64748b"
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  backButton: { padding: 10 },
  backIcon: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  chatArea: { flex: 1, backgroundColor: '#0b1120' },
  chatContent: { padding: 15 },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 5,
  },
  systemBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 5,
  },
  messageText: { color: 'white', fontSize: 16 },
  systemText: { color: '#94a3b8', fontFamily: 'monospace', fontSize: 13 },
  readReceipt: { color: '#93c5fd', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#0f172a',
    alignItems: 'center',
  },
  attachButton: { padding: 10 },
  attachIcon: { fontSize: 22 },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    color: 'white',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: { color: 'white', fontSize: 18 }
});
