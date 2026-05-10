import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { ResourceDetail, getResourceDetail, createComment, getMediaUrl } from '../services/resourceService';
import { addFavorite, removeFavorite } from '../services/favoriteService';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/RootNavigator';

type DetailRoute = RouteProp<RootStackParamList, 'ResourceDetail'>;

export function ResourceDetailScreen() {
  const route = useRoute<DetailRoute>();
  const { id } = route.params;
  const { isAuthenticated } = useAuth();

  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadResource();
  }, [id]);

  const loadResource = async () => {
    try {
      const data = await getResourceDetail(id);
      setResource(data);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      Alert.alert('Connexion requise', 'Connectez-vous pour ajouter aux favoris');
      return;
    }
    try {
      if (isFavorite) {
        await removeFavorite(id);
        setIsFavorite(false);
      } else {
        await addFavorite(id);
        setIsFavorite(true);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    if (!isAuthenticated) {
      Alert.alert('Connexion requise', 'Connectez-vous pour commenter');
      return;
    }

    setSubmitting(true);
    try {
      await createComment(id, commentText.trim());
      setCommentText('');
      Alert.alert('Succès', 'Commentaire envoyé, en attente de modération');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  if (!resource) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Ressource introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Media */}
      {resource.type === 'photo' && (
        <Image
          source={{ uri: getMediaUrl(resource.content, 'photo') }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      {resource.type === 'video' && (
        <Video
          source={{ uri: getMediaUrl(resource.content, 'video') }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
        />
      )}

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.title}>{resource.description || 'Sans titre'}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.category}>{resource.category}</Text>
          <Text style={styles.date}>{resource.datePublication || resource.dateCreation}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={18} color="#94a3b8" />
            <Text style={styles.statValue}>{resource.views}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={18} color="#94a3b8" />
            <Text style={styles.statValue}>{resource.favori}</Text>
          </View>
          <Text style={styles.author}>par {resource.author}</Text>
        </View>

        {/* Favorite button */}
        {isAuthenticated && (
          <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#ef4444' : '#60a5fa'}
            />
            <Text style={styles.favoriteText}>
              {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Comments */}
      <View style={styles.commentsSection}>
        <Text style={styles.sectionTitle}>
          Commentaires ({resource.comments.length})
        </Text>

        {resource.comments.map((comment) => (
          <View key={comment.id} style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>{comment.author}</Text>
              <Text style={styles.commentDate}>{comment.date}</Text>
            </View>
            <Text style={styles.commentContent}>{comment.content}</Text>
          </View>
        ))}

        {resource.comments.length === 0 && (
          <Text style={styles.noComments}>Aucun commentaire pour le moment</Text>
        )}

        {/* Add comment */}
        {isAuthenticated && (
          <View style={styles.addComment}>
            <TextInput
              style={styles.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Écrire un commentaire..."
              placeholderTextColor="#64748b"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, submitting && { opacity: 0.6 }]}
              onPress={handleSubmitComment}
              disabled={submitting}
            >
              <Ionicons name="send" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  image: {
    width: '100%',
    height: 250,
  },
  video: {
    width: '100%',
    height: 250,
    backgroundColor: '#000000',
  },
  infoSection: {
    padding: 20,
  },
  title: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  category: {
    color: '#60a5fa',
    fontSize: 13,
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  date: {
    color: '#64748b',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statValue: {
    color: '#94a3b8',
    fontSize: 14,
    marginLeft: 4,
  },
  author: {
    color: '#64748b',
    fontSize: 13,
    marginLeft: 'auto',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  favoriteText: {
    color: '#e2e8f0',
    fontSize: 14,
    marginLeft: 8,
  },
  commentsSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  commentCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentAuthor: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '600',
  },
  commentDate: {
    color: '#64748b',
    fontSize: 12,
  },
  commentContent: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  noComments: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  addComment: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    color: '#f1f5f9',
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 12,
    marginLeft: 8,
  },
});
