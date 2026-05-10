import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { uploadResource, getCategories, Category } from '../services/resourceService';

export function CreateResourceScreen() {
  const navigation = useNavigation();
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [restreint, setRestreint] = useState(false);
  const [file, setFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop() || 'media';
      const type = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';
      setFile({ uri: asset.uri, name: filename, type });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier');
      return;
    }
    if (!categoryId) {
      Alert.alert('Erreur', 'Veuillez choisir une catégorie');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Erreur', 'Veuillez ajouter une description');
      return;
    }

    setLoading(true);
    try {
      await uploadResource(file, description.trim(), categoryId, restreint);
      Alert.alert('Succès', 'Ressource envoyée ! Elle sera visible après modération.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* File picker */}
      <TouchableOpacity style={styles.filePicker} onPress={pickMedia}>
        {file ? (
          <View style={styles.filePreview}>
            <Image source={{ uri: file.uri }} style={styles.previewImage} resizeMode="cover" />
            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
          </View>
        ) : (
          <View style={styles.filePickerEmpty}>
            <Ionicons name="cloud-upload-outline" size={40} color="#60a5fa" />
            <Text style={styles.filePickerText}>Sélectionner une image ou vidéo</Text>
            <Text style={styles.filePickerHint}>JPG, PNG, WebP, GIF, MP4, WebM</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Décrivez votre ressource..."
        placeholderTextColor="#64748b"
        multiline
        numberOfLines={4}
      />

      {/* Category */}
      <Text style={styles.label}>Catégorie</Text>
      <View style={styles.categoryGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryOption,
              categoryId === cat.id && styles.categoryOptionActive,
            ]}
            onPress={() => setCategoryId(cat.id)}
          >
            <Text
              style={[
                styles.categoryOptionText,
                categoryId === cat.id && styles.categoryOptionTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Restricted */}
      <View style={styles.switchRow}>
        <Switch
          value={restreint}
          onValueChange={setRestreint}
          trackColor={{ false: '#334155', true: '#2563eb' }}
          thumbColor={restreint ? '#60a5fa' : '#64748b'}
        />
        <Text style={styles.switchLabel}>Contenu restreint (visible uniquement aux connectés)</Text>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleUpload}
        disabled={loading}
      >
        <Ionicons name="cloud-upload" size={20} color="#ffffff" />
        <Text style={styles.submitText}>
          {loading ? 'Envoi en cours...' : 'Publier la ressource'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  filePicker: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    marginBottom: 20,
    overflow: 'hidden',
  },
  filePickerEmpty: {
    alignItems: 'center',
    padding: 40,
  },
  filePickerText: {
    color: '#e2e8f0',
    fontSize: 15,
    marginTop: 12,
  },
  filePickerHint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  filePreview: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  fileName: {
    color: '#94a3b8',
    fontSize: 12,
    padding: 8,
  },
  label: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 14,
    color: '#f1f5f9',
    fontSize: 16,
    marginBottom: 20,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryOption: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryOptionActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryOptionText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  categoryOptionTextActive: {
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchLabel: {
    color: '#e2e8f0',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
