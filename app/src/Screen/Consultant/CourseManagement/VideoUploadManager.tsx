import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Upload, PlayCircle, Trash2, Plus } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';

interface Video {
  id: string;
  title: string;
  description: string;
  duration: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  progress: number;
  thumbnailUrl?: string;
  videoUrl?: string;
}

interface VideoUploadManagerProps {
  courseId: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function VideoUploadManager({ courseId, onClose, onComplete }: VideoUploadManagerProps) {
  const navigation = useNavigation();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addVideo = () => {
    const newVideo: Video = {
      id: Date.now().toString(),
      title: `Video ${videos.length + 1}`,
      description: '',
      duration: 0,
      status: 'uploading',
      progress: 0,
    };

    setVideos(prev => [...prev, newVideo]);

    // Simulate upload progress
    simulateUpload(newVideo.id);
  };

  const simulateUpload = (videoId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, status: 'processing', progress: 100 }
            : video
        ));

        // Simulate processing
        setTimeout(() => {
          setVideos(prev => prev.map(video => 
            video.id === videoId 
              ? { 
                  ...video, 
                  status: 'ready',
                  videoUrl: 'https://example.com/video.mp4',
                  thumbnailUrl: 'https://example.com/thumbnail.jpg'
                }
              : video
          ));
        }, 2000);
      } else {
        setVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, progress }
            : video
        ));
      }
    }, 500);
  };

  const deleteVideo = (videoId: string) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setVideos(prev => prev.filter(video => video.id !== videoId)),
        },
      ]
    );
  };

  const setAsPreview = (videoId: string) => {
    Alert.alert('Preview Set', 'This video is now set as the course preview.');
  };

  const handleComplete = () => {
    if (videos.length === 0) {
      Alert.alert('No Videos', 'Please add at least one video to complete the course.');
      return;
    }

    const readyVideos = videos.filter(video => video.status === 'ready');
    if (readyVideos.length === 0) {
      Alert.alert('Processing', 'Please wait for all videos to finish processing.');
      return;
    }

    onComplete();
  };

  const getStatusColor = (status: Video['status']) => {
    switch (status) {
      case 'uploading':
        return COLORS.blue;
      case 'processing':
        return COLORS.orange;
      case 'ready':
        return COLORS.green;
      case 'error':
        return COLORS.red;
      default:
        return COLORS.gray;
    }
  };

  const getStatusText = (status: Video['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'ready':
        return 'Ready';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
      }}>
        <TouchableOpacity onPress={onClose}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: COLORS.black,
          marginLeft: 16,
          flex: 1,
        }}>
          Course Videos
        </Text>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <Text style={{
          fontSize: 16,
          color: COLORS.gray,
          marginBottom: 20,
        }}>
          Add video content to your course. Students will be able to watch these videos in the order you arrange them.
        </Text>

        {/* Add Video Button */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            borderWidth: 2,
            borderColor: COLORS.green,
            borderRadius: 8,
            borderStyle: 'dashed',
            marginBottom: 20,
          }}
          onPress={addVideo}
        >
          <Plus size={24} color={COLORS.green} />
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: COLORS.green,
            marginLeft: 8,
          }}>
            Add Video
          </Text>
        </TouchableOpacity>

        {/* Videos List */}
        {videos.map((video, index) => (
          <View key={video.id} style={{
            backgroundColor: COLORS.white,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: COLORS.lightGray,
          }}>
            {/* Video Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <View style={{
                width: 60,
                height: 40,
                backgroundColor: COLORS.lightGray,
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}>
                <PlayCircle size={24} color={COLORS.gray} />
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: COLORS.black,
                  marginBottom: 4,
                }}>
                  {video.title}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: COLORS.gray,
                }}>
                  Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                </Text>
              </View>

              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                backgroundColor: getStatusColor(video.status) + '20',
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: getStatusColor(video.status),
                }}>
                  {getStatusText(video.status)}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            {(video.status === 'uploading' || video.status === 'processing') && (
              <View style={{
                marginBottom: 12,
              }}>
                <View style={{
                  height: 4,
                  backgroundColor: COLORS.lightGray,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    height: '100%',
                    width: `${video.progress}%`,
                    backgroundColor: getStatusColor(video.status),
                    borderRadius: 2,
                  }} />
                </View>
                <Text style={{
                  fontSize: 12,
                  color: COLORS.gray,
                  marginTop: 4,
                }}>
                  {Math.round(video.progress)}% complete
                </Text>
              </View>
            )}

            {/* Video Actions */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View style={{
                flexDirection: 'row',
                gap: 8,
              }}>
                {video.status === 'ready' && (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 8,
                      borderRadius: 6,
                      backgroundColor: COLORS.green + '20',
                    }}
                    onPress={() => setAsPreview(video.id)}
                  >
                    <PlayCircle size={16} color={COLORS.green} />
                    <Text style={{
                      fontSize: 12,
                      color: COLORS.green,
                      marginLeft: 4,
                    }}>
                      Set as Preview
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={() => deleteVideo(video.id)}
              >
                <Trash2 size={20} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {videos.length === 0 && (
          <View style={{
            alignItems: 'center',
            padding: 40,
          }}>
            <Upload size={48} color={COLORS.gray} />
            <Text style={{
              fontSize: 16,
              color: COLORS.gray,
              marginTop: 16,
              textAlign: 'center',
            }}>
              No videos added yet. Tap "Add Video" to get started.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={{
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
        gap: 12,
      }}>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: COLORS.gray,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={onClose}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black }}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            padding: 16,
            borderRadius: 8,
            backgroundColor: COLORS.green,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={handleComplete}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.white }}>
            Complete Course
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
