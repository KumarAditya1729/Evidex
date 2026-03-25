import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Platform, KeyboardAvoidingView, Image, FlatList, ScrollView, StatusBar } from 'react-native';

const MOCK_EVIDENCE_CHATS = [
  { id: '1', hash: 'e3b0c442...', fileName: 'financial_audit_2025.pdf', network: 'POLYGON', timestamp: '10:42 AM', status: 'ANCHORED', color: '#a855f7' },
  { id: '2', hash: '8f434346...', fileName: 'court_subpoena.docx', network: 'ETHEREUM', timestamp: 'Yesterday', status: 'VERIFIED', color: '#3b82f6' },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('LOGIN'); // 'LOGIN' | 'CHATS' | 'CHAT_DETAIL' | 'NEW_CHAT'
  const [walletAddress, setWalletAddress] = useState('');
  const [receiverWallet, setReceiverWallet] = useState('');
  
  // Chat Detail State
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: 'End-to-end encrypted cryptographic bridge established.', isSystem: true },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), text: message, isSystem: false }]);
    setMessage('');
    
    // Simulate anchoring response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now().toString() + 'sys', 
        text: `🟢 Anchored\nHash: ${Math.random().toString(16).substring(2, 10)}`, 
        isSystem: true 
      }]);
    }, 1500);
  };

  // ---------------------------------------------------------------------------
  // SCREEN 1: THE LOGIN UI
  // ---------------------------------------------------------------------------
  if (currentScreen === 'LOGIN') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.authHeader}>
            <Image source={require('./assets/icon.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.authTitle}>Welcome to Evidex</Text>
            <Text style={styles.subtitle}>The Web3 Evidence Messenger</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <View style={styles.prefixBox}><Text style={styles.prefixText}>0x</Text></View>
              <TextInput
                style={styles.input}
                placeholder="Your Crypto Wallet Address"
                placeholderTextColor="#64748b"
                value={walletAddress}
                onChangeText={setWalletAddress}
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.helperText}>
              Instead of a phone number, Evidex uses your decentralized Crypto Wallet to verify your identity.
            </Text>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={() => setCurrentScreen('CHATS')}>
            <Text style={styles.loginButtonText}>Connect to Ledger</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN 2: NEW CHAT / ENTER RECEIVER WALLET
  // ---------------------------------------------------------------------------
  if (currentScreen === 'NEW_CHAT') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('CHATS')} style={styles.iconBtn}><Text style={styles.headerTitle}>←</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>New Secure Chat</Text>
          <View style={{width: 40}} />
        </View>

        <View style={[styles.container, { justifyContent: 'flex-start', paddingTop: 40 }]}>
          <Text style={{color: '#94a3b8', fontSize: 16, marginBottom: 20, textAlign: 'center'}}>
            Enter the Receiver's Wallet Address to initiate an encrypted evidence channel.
          </Text>
          <View style={[styles.inputWrapper, { marginBottom: 30 }]}>
            <View style={styles.prefixBox}><Text style={styles.prefixText}>0x</Text></View>
            <TextInput
              style={styles.input}
              placeholder="Receiver Crypto Wallet"
              placeholderTextColor="#64748b"
              value={receiverWallet}
              onChangeText={setReceiverWallet}
              autoCapitalize="none"
              autoFocus
            />
          </View>

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => {
              if (receiverWallet.length > 5) setCurrentScreen('CHAT_DETAIL');
              else alert("Enter a valid wallet");
            }}
          >
            <Text style={styles.loginButtonText}>Start Chat</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN 3: CHAT DETAIL (MESSAGING UI)
  // ---------------------------------------------------------------------------
  if (currentScreen === 'CHAT_DETAIL') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          
          {/* Detailed Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setCurrentScreen('CHATS')} style={styles.iconBtn}>
              <Text style={styles.headerTitle}>←</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                0x{receiverWallet.substring(0, 6)}...{receiverWallet.substring(receiverWallet.length - 4)}
              </Text>
              <Text style={{ color: '#06b6d4', fontSize: 12 }}>Arbitrum Network</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => alert('View Smart Contract Audit')}><Text style={{fontSize: 20}}>🛡️</Text></TouchableOpacity>
          </View>

          <ScrollView style={styles.chatArea} contentContainerStyle={{ padding: 15 }}>
            {messages.map(msg => (
              <View key={msg.id} style={[styles.messageBubble, msg.isSystem ? styles.systemBubble : styles.userBubble]}>
                <Text style={[styles.messageText, msg.isSystem && styles.systemText]}>{msg.text}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton} onPress={() => alert('Attachments open file picker')}><Text style={styles.attachIcon}>📎</Text></TouchableOpacity>
            <TouchableOpacity style={styles.attachButton} onPress={() => alert('Camera opens explicitly')}><Text style={styles.attachIcon}>📸</Text></TouchableOpacity>
            <TextInput style={styles.chatInput} placeholder="Type evidence note..." placeholderTextColor="#64748b" value={message} onChangeText={setMessage} />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}><Text style={styles.sendIcon}>➤</Text></TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN 4: INBOX (CHATS LIST)
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CHATS</Text>
        <TouchableOpacity style={styles.iconBtn}><Text style={{fontSize: 22}}>📷</Text></TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_EVIDENCE_CHATS}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatRow} onPress={() => {
            setReceiverWallet(item.hash);
            setCurrentScreen('CHAT_DETAIL');
          }}>
            <View style={[styles.avatar, { backgroundColor: item.color + '20' }]}>
              <Text style={[styles.avatarText, { color: item.color }]}>{item.network.substring(0, 1)}</Text>
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatRowHeader}>
                <Text style={styles.chatName}>{item.fileName}</Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
              <View style={styles.chatRowHeader}>
                <Text style={styles.messagePreview} numberOfLines={1}>{item.status} - {item.network}</Text>
                <Text style={{fontSize: 10}}>🟢</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* FAB Floating Action Button for New Chat */}
      <TouchableOpacity style={styles.fab} onPress={() => setCurrentScreen('NEW_CHAT')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 20, justifyContent: 'space-between' },
  authHeader: { alignItems: 'center', marginTop: 40 },
  logo: { width: 100, height: 100, borderRadius: 25, marginBottom: 15 },
  authTitle: { color: '#3b82f6', fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { color: '#f8fafc', fontSize: 18, fontWeight: '600' },
  formContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  instruction: { color: '#94a3b8', textAlign: 'center', marginBottom: 40, fontSize: 14, paddingHorizontal: 20 },
  inputWrapper: { flexDirection: 'row', width: '100%', borderBottomWidth: 2, borderBottomColor: '#3b82f6', alignItems: 'center', paddingBottom: 5 },
  prefixBox: { marginRight: 10, paddingRight: 10, borderRightWidth: 1, borderRightColor: '#334155' },
  prefixText: { color: '#3b82f6', fontSize: 18, fontWeight: 'bold' },
  input: { flex: 1, color: '#ffffff', fontSize: 18, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  helperText: { color: '#64748b', textAlign: 'center', marginTop: 20, fontSize: 12 },
  loginButton: { backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginBottom: 20 },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },

  // Inbox List Styles
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  iconBtn: { padding: 5 },
  chatRow: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  chatInfo: { flex: 1 },
  chatRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chatName: { color: '#f8fafc', fontSize: 16, fontWeight: '600' },
  timestamp: { color: '#64748b', fontSize: 12 },
  messagePreview: { color: '#94a3b8', fontSize: 14, flex: 1, marginRight: 10 },
  separator: { height: 1, backgroundColor: '#1e293b', marginLeft: 80 },
  
  // Floating Action Button
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { color: 'white', fontSize: 30, marginTop: -2 },

  // Detail Chat Styles
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  chatArea: { flex: 1, backgroundColor: '#0b1120' },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 20, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#3b82f6', borderBottomRightRadius: 5 },
  systemBubble: { alignSelf: 'flex-start', backgroundColor: '#1e293b', borderBottomLeftRadius: 5 },
  messageText: { color: 'white', fontSize: 16 },
  systemText: { color: '#94a3b8', fontFamily: 'monospace', fontSize: 13 },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#0f172a', alignItems: 'center' },
  attachButton: { padding: 10 },
  attachIcon: { fontSize: 22 },
  chatInput: { flex: 1, backgroundColor: '#1e293b', color: 'white', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginHorizontal: 10, fontSize: 16 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  sendIcon: { color: 'white', fontSize: 18 }
});
