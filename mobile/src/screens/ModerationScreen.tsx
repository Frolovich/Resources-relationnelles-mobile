import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL, MEDIA_BASE_URL } from '../config/api';
import { getToken } from '../services/authService';

interface PendingResource {
  id: number;
  description: string;
  type: string;
  content: string;
  category: string;
  author: string;
  createdAt: string;
}

interface PendingComment {
  id: number;
  content: string;
  author: string;
  resourceId: number;
  date: string;
}

export function ModerationScreen() {
  const [tab, setTab] = useState<'resources' | 'comments'>('resources');
  const [resources, setResources] = useState<PendingResource[]>([]);
  const [comments, setComments] = useState<PendingComment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const token = await getToken();
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resRes, comRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/moderation/resources`, { headers }),
        fetch(`${API_BASE_URL}/api/moderation/comments`, { headers }),
      ]);

      if (resRes.ok) {
        const data = await resRes.json();
        setResources(Array.isArray(data) ? data : []);
      }
      if (comRes.ok) {
        const data = await comRes.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const moderateResource = async (id: number, action: 'approve' | 'refuse') => {
    const token = await getToken();
    if (!token) return;

    const reason = action === 'refuse' ? 'Non conforme aux règles' : undefined;

    try {
      const response = await fetch(`${API_BASE_URL}/api/moderation/resources/${id}/${action}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: reason ? JSON.stringify({ reason }) : undefined,
      });

      if (response.ok) {
        setResources((prev) => prev.filter((r) => r.id !== id));
        Alert.alert('Succès', action === 'approve' ? 'Ressource approuvée' : 'Ressource refusée');
      } else {
        Alert.alert('Erreur', 'Action échouée');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur réseau');
    }
  };

  const moderateComment = async (id: number, action: 'approve' | 'refuse') => {
    const token = await getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/moderation/comments/${id}/${action}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: action === 'refuse' ? JSON.stringify({ reason: 'Non conforme' }) : undefined,
      });

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
        Alert.alert('Succès', action === 'approve' ? 'Commentaire approuvé' : 'Commentaire refusé');
      } else {
        Alert.alert('Erreur', 'Action échouée');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur réseau');
    }
  };

  const renderResource = ({ item }: { item: PendingResource }) => (
    <View style={styles.card}>
      {item.type === 'photo' && (
        <Image
          source={{ uri: `${MEDIA_BASE_URL}/images/${item.content}` }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      )}
      {item.type === 'video' && (
        <View style={styles.videoTag}>
          <Ionicons name="videocam" size={16} color="#60a5fa" />
          <Text style={styles.videoTagText}>Vidéo</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.description || 'Sans titre'}</Text>
        <Text style={styles.cardMeta}>par {item.author} • {item.category}</Text>
        <Text style={styles.cardDate}>{item.createdAt}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => moderateResource(item.id, 'approve')}
        >
          <Ionicons name="checkmark" size={20} color="#ffffff" />
          <Text style={styles.actionText}>Approuver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.refuseBtn]}
          onPress={() => moderateResource(item.id, 'refuse')}
        >
          <Ionicons name="close" size={20} color="#ffffff" />
          <Text style={styles.actionText}>Refuser</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderComment = ({ item }: { item: PendingComment }) => (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <Text style={styles.commentContent}>"{item.content}"</Text>
        <Text style={styles.cardMeta}>par {item.author} • Ressource #{item.resourceId}</Text>
        <Text style={styles.cardDate}>{item.date}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => moderateComment(item.id, 'approve')}
        >
          <Ionicons name="checkmark" size={20} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.refuseBtn]}
          onPress={() => moderateComment(item.id, 'refuse')}
        >
          <Ionicons name="close" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'resources' && styles.tabActive]}
          onPress={() => setTab('resources')}
        >
          <Text style={[styles.tabText, tab === 'resources' && styles.tabTextActive]}>
            Ressources ({resources.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'comments' && styles.tabActive]}
          onPress={() => setTab('comments')}
        >
          <Text style={[styles.tabText, tab === 'comments' && styles.tabTextActive]}>
            Commentaires ({comments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'resources' ? (
        <FlatList
          data={resources}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderResource}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#60a5fa" />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#34d399" />
                <Text style={styles.emptyText}>Aucune ressource en attente</Text>
              </View>
            ) : null
          }
        />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderComment}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#60a5fa" />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#34d399" />
                <Text style={styles.emptyText}>Aucun commentaire en attente</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#334155' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#60a5fa' },
  tabText: { color: '#64748b', fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: '#60a5fa' },
  listContent: { padding: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
  cardImage: { width: '100%', height: 150 },
  videoTag: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#0f172a' },
  videoTagText: { color: '#60a5fa', fontSize: 13, marginLeft: 6 },
  cardBody: { padding: 12 },
  cardTitle: { color: '#f1f5f9', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cardMeta: { color: '#94a3b8', fontSize: 12, marginBottom: 2 },
  cardDate: { color: '#475569', fontSize: 11 },
  commentContent: { color: '#e2e8f0', fontSize: 14, fontStyle: 'italic', marginBottom: 6 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#334155' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  approveBtn: { backgroundColor: '#166534' },
  refuseBtn: { backgroundColor: '#991b1b' },
  actionText: { color: '#ffffff', fontSize: 13, fontWeight: '600', marginLeft: 4 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 12 },
});
