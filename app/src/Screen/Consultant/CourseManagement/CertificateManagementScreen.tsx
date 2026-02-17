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
import { ArrowLeft, Award, Download, Edit, Plus, Eye } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';

export default function CertificateManagementScreen() {
  const navigation = useNavigation();

  const certificates = [
    {
      id: '1',
      name: 'Course Completion Certificate',
      description: 'Standard certificate for course completion',
      usage: 342,
      status: 'active',
      createdAt: '2024-01-10',
    },
    {
      id: '2',
      name: 'Achievement Certificate',
      description: 'Special certificate for outstanding performance',
      usage: 28,
      status: 'active',
      createdAt: '2024-01-15',
    },
    {
      id: '3',
      name: 'Participation Certificate',
      description: 'Certificate for course participation',
      usage: 156,
      status: 'draft',
      createdAt: '2024-01-20',
    },
  ];

  const renderCertificateItem = (certificate: typeof certificates[0]) => (
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
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: COLORS.black,
            marginBottom: 4,
          }}>
            {certificate.name}
          </Text>
          
          <Text style={{
            fontSize: 14,
            color: COLORS.gray,
            marginBottom: 8,
          }}>
            {certificate.description}
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <View style={{
              backgroundColor: certificate.status === 'active' ? COLORS.green + '20' : COLORS.orange + '20',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
              marginRight: 12,
            }}>
              <Text style={{
                fontSize: 10,
                color: certificate.status === 'active' ? COLORS.green : COLORS.orange,
                fontWeight: '500',
                textTransform: 'uppercase',
              }}>
                {certificate.status}
              </Text>
            </View>
            
            <Text style={{
              fontSize: 12,
              color: COLORS.gray,
            }}>
              Used {certificate.usage} times
            </Text>
          </View>
        </View>
        
        <View style={{
          width: 40,
          height: 40,
          backgroundColor: COLORS.lightGray,
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Award size={20} color={COLORS.gray} />
        </View>
      </View>
      
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
      }}>
        <Text style={{
          fontSize: 12,
          color: COLORS.gray,
        }}>
          Created {certificate.createdAt}
        </Text>
        
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={{
              padding: 8,
              marginRight: 8,
            }}
            onPress={() => Alert.alert('Preview', 'Certificate preview coming soon!')}
          >
            <Eye size={16} color={COLORS.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              padding: 8,
              marginRight: 8,
            }}
            onPress={() => Alert.alert('Edit', 'Certificate editing coming soon!')}
          >
            <Edit size={16} color={COLORS.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              padding: 8,
            }}
            onPress={() => Alert.alert('Download', 'Certificate download coming soon!')}
          >
            <Download size={16} color={COLORS.gray} />
          </TouchableOpacity>
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
          Certificate Management
        </Text>
      </View>

      {/* Create Button */}
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
          onPress={() => Alert.alert('Coming Soon', 'Certificate creation feature will be available soon!')}
        >
          <Plus size={20} color={COLORS.white} />
          <Text style={{
            color: COLORS.white,
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8,
          }}>
            Create New Certificate
          </Text>
        </TouchableOpacity>
      </View>

      {/* Certificates List */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: COLORS.black,
          marginBottom: 16,
        }}>
          Certificate Templates
        </Text>
        
        {certificates.map(renderCertificateItem)}
        
        {/* Info Card */}
        <View style={{
          backgroundColor: '#E3F2FD',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: COLORS.blue,
        }}>
          <Text style={{
            fontSize: 14,
            color: '#1565C0',
            fontWeight: '500',
            marginBottom: 8,
          }}>
            💡 Certificate Tips
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#1976D2',
            lineHeight: 18,
          }}>
            • Create professional certificates that motivate students\n• Include your branding and course information\n• Set up automatic issuance upon course completion\n• Track certificate usage and engagement
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
