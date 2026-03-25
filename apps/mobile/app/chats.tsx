import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

const MOCK_EVIDENCE_CHATS = [
  {
    id: '1',
    hash: 'e3b0c442...',
    fileName: 'financial_audit_2025.pdf',
    network: 'POLYGON',
    timestamp: '10:42 AM',
    status: 'ANCHORED',
    color: '#a855f7' // Purple
  },
  {
    id: '2',
    hash: '8f434346...',
    fileName: 'court_subpoena.docx',
    network: 'ETHEREUM',
    timestamp: 'Yesterday',
    status: 'VERIFIED',
    color: '#3b82f6' // Blue
  },
  {
    id: '3',
    hash: '908d11c2...',
    fileName: 'accident_photo_01.jpg',
    network: 'ARBITRUM',
    timestamp: 'Monday',
    status: 'ANCHORED',
    color: '#06b6d4' // Cyan
  }
];

export default function EvidenceChatList() {
  const router = useRouter();

  const renderItem = ({ item }: { item: typeof MOCK_EVIDENCE_CHATS[0] }) => (
    <TouchableOpacity 
      style={styles.chatRow} 
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={[styles.avatar, { backgroundColor: item.color + '20' }]}>
        <Text style={[styles.avatarText, { color: item.color }]}>
          {item.network.substring(0, 1)}
        </Text>
      </View>
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.fileName}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        <View style={styles.chatHeader}>
          <Text style={styles.messagePreview} numberOfLines={1}>
            {item.status}: {item.hash} - Anchored to {item.network}
          </Text>
          <Text style={styles.readReceipt}>🟢</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CHATS</Text>
        <TouchableOpacity style={styles.cameraButton}>
          <Text style={styles.cameraIcon}>📸</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_EVIDENCE_CHATS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* FAB Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => alert('New Evidence Chat')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a', // Deep slate
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  cameraButton: {
    padding: 8,
  },
  cameraIcon: {
    fontSize: 22,
  },
  listContainer: {
    paddingBottom: 100,
  },
  chatRow: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: '#64748b',
    fontSize: 12,
  },
  messagePreview: {
    color: '#94a3b8',
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  readReceipt: {
    fontSize: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#1e293b',
    marginLeft: 80, // Offset for avatar
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    color: 'white',
    fontSize: 30,
    fontWeight: '300',
    marginTop: -2,
  }
});
