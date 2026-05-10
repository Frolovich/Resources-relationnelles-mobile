import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FavoriteItem, getFavorites, removeFavorite } from '../services/favoriteService';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/RootNavigator';

type FavNav = NativeStackNavigationProp<RootStackParamList>;

export function FavoritesScreen() {
  const navigation = useNavigation<FavNav>();
  const { isAuthenticated } = useAuth();
  const isFocused = useIsFocused();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadFavorites();
    }
  }, [isFocused]);

  const handleRemove = async (resourceId: number) => {
    Alert.alert('Retirer', 'Retirer cette ressource des favoris ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFavorite(resourceId);
            setFavorites((prev) => prev.filter((f) => f.resourceId !== resourceId));
          } catch (error: any) {
            Alert.alert('Erreur', error.message);
          }
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={48} color="#475569" />
          <Text style={styles.emptyText}>Connectez-vous pour voir vos favoris</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: FavoriteItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ResourceDetail', { id: item.resourceId })}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.typeIcon}>
          <Ionicons
            name={item.type === 'photo' ? 'image' : 'videocam'}
            size={24}
            color="#60a5fa"
          />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title || 'Sans titre'}
          </Text>
          <Text style={styles.cardDate}>{item.createdAt}</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(item.resourceId)}
        >
          <Ionicons name="heart-dislike" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadFavorites(); }}
            tintColor="#60a5fa"
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>Aucun favori</Text>
              <Text style={styles.emptySubtext}>
                Ajoutez des ressources à vos favoris pour les retrouver ici
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '500',
  },
  cardDate: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#475569',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
