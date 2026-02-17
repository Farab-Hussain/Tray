import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Video, Upload, PlayCircle, Clock, MoreVertical } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';

export default function VideoManagementScreen() {
  const navigation = useNavigation();

  const videos = [
    {
      id: '1',
      title: 'Introduction to Course',
      duration: '5:23',
      status: 'uploaded',
      uploadDate: '2024-01-15',
      size: '45.2 MB',
    },
    {
      id: '2',
      title: 'Chapter 1: Basic Concepts',
      duration: '12:45',
      status: 'processing',
      uploadDate: '2024-01-14',
      size: '98.7 MB',
    },
  ];

  const renderVideoItem = (video: typeof videos[0]) => (
    <View style={{
      backgroundColor: COLORS.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        }}>
          <View style={{
            width: 60,
            height: 60,
            backgroundColor: COLORS.lightGray,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
          }}>
            <Video size={24} color={COLORS.gray} />
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
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Clock size={12} color={COLORS.gray} />
              <Text style={{
                fontSize: 12,
                color: COLORS.gray,
                marginLeft: 4,
                marginRight: 12,
              }}>
                {video.duration}
              </Text>
              
              <Text style={{
                fontSize: 12,
                color: COLORS.gray,
              }}>
                {video.size}
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity>
          <MoreVertical size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>
      
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
      }}>
        <Text style={{
          fontSize: 12,
          color: COLORS.gray,
        }}>
          Uploaded {video.uploadDate}
        </Text>
        
        <View style={{
          backgroundColor: video.status === 'uploaded' ? COLORS.green + '20' : COLORS.orange + '20',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 4,
        }}>
          <Text style={{
            fontSize: 10,
            color: video.status === 'uploaded' ? COLORS.green : COLORS.orange,
            fontWeight: '500',
            textTransform: 'uppercase',
          }}>
            {video.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: COLORS.black,
          marginLeft: 16,
          flex: 1,
        }}>
          Video Management
        </Text>
      </View>

      {/* Upload Button */}
      <View style={{ padding: 16 }}>
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.green,
            padding: 16,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => Alert.alert('Coming Soon', 'Video upload feature will be available soon!')}
        >
          <Upload size={20} color={COLORS.white} />
          <Text style={{
            color: COLORS.white,
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8,
          }}>
            Upload New Video
          </Text>
        </TouchableOpacity>
      </View>

      {/* Videos List */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: COLORS.black,
          marginBottom: 16,
        }}>
          Course Videos
        </Text>
        
        {videos.map(renderVideoItem)}
      </ScrollView>
    </SafeAreaView>
  );
}
