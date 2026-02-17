import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, TrendingUp, Users, DollarSign, Clock, Award } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';

const { width: screenWidth } = Dimensions.get('window');

export default function CourseAnalyticsScreen() {
  const navigation = useNavigation();

  const analyticsData = {
    totalViews: 12543,
    totalStudents: 892,
    totalRevenue: 15420.50,
    averageWatchTime: 45,
    completionRate: 78,
    certificatesIssued: 342,
  };

  const monthlyData = [
    { month: 'Jan', views: 1200, students: 85, revenue: 2100 },
    { month: 'Feb', views: 1450, students: 92, revenue: 2450 },
    { month: 'Mar', views: 1680, students: 110, revenue: 2890 },
    { month: 'Apr', views: 1890, students: 125, revenue: 3200 },
    { month: 'May', views: 2100, students: 140, revenue: 3580 },
    { month: 'Jun', views: 2233, students: 150, revenue: 3800 },
  ];

  const renderStatCard = (title: string, value: string | number, icon: any, color: string, subtitle?: string) => (
    <View style={{
      backgroundColor: COLORS.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      flex: 1,
      marginHorizontal: 4,
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <View style={{
          width: 40,
          height: 40,
          backgroundColor: color + '20',
          borderRadius: 20,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          {React.createElement(icon, { size: 20, color: color })}
        </View>
        <Text style={{
          fontSize: 14,
          color: COLORS.gray,
          flex: 1,
        }}>
          {title}
        </Text>
      </View>
      
      <Text style={{
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 4,
      }}>
        {value}
      </Text>
      
      {subtitle && (
        <Text style={{
          fontSize: 12,
          color: COLORS.gray,
        }}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const renderChartPlaceholder = () => (
    <View style={{
      backgroundColor: COLORS.white,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 16,
      }}>
        Performance Trends
      </Text>
      
      <View style={{
        height: 200,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <TrendingUp size={48} color={COLORS.gray} />
        <Text style={{
          fontSize: 16,
          color: COLORS.gray,
          marginTop: 12,
          textAlign: 'center',
        }}>
          Interactive charts coming soon!
        </Text>
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
          Course Analytics
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Key Metrics */}
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: COLORS.black,
          marginBottom: 16,
        }}>
          Key Metrics
        </Text>
        
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginBottom: 24,
        }}>
          {renderStatCard('Total Views', analyticsData.totalViews.toLocaleString(), TrendingUp, COLORS.blue)}
          {renderStatCard('Students', analyticsData.totalStudents.toLocaleString(), Users, COLORS.orange)}
          {renderStatCard('Revenue', `$${analyticsData.totalRevenue.toLocaleString()}`, DollarSign, COLORS.green)}
          {renderStatCard('Avg Watch Time', `${analyticsData.averageWatchTime}m`, Clock, COLORS.purple)}
        </View>

        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginBottom: 24,
        }}>
          {renderStatCard('Completion Rate', `${analyticsData.completionRate}%`, Award, COLORS.green, '📈')}
          {renderStatCard('Certificates', analyticsData.certificatesIssued.toLocaleString(), Award, COLORS.orange, '🏆')}
        </View>

        {/* Performance Chart */}
        {renderChartPlaceholder()}

        {/* Monthly Table */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: COLORS.black,
            marginBottom: 16,
          }}>
            Monthly Breakdown
          </Text>
          
          {monthlyData.map((item, index) => (
            <View key={item.month} style={{
              flexDirection: 'row',
              paddingVertical: 12,
              borderBottomWidth: index < monthlyData.length - 1 ? 1 : 0,
              borderBottomColor: COLORS.lightGray,
            }}>
              <Text style={{
                flex: 1,
                fontSize: 14,
                color: COLORS.black,
                fontWeight: '500',
              }}>
                {item.month}
              </Text>
              <Text style={{
                flex: 1,
                fontSize: 14,
                color: COLORS.gray,
                textAlign: 'center',
              }}>
                {item.views.toLocaleString()} views
              </Text>
              <Text style={{
                flex: 1,
                fontSize: 14,
                color: COLORS.gray,
                textAlign: 'center',
              }}>
                {item.students} students
              </Text>
              <Text style={{
                flex: 1,
                fontSize: 14,
                color: COLORS.green,
                fontWeight: '600',
                textAlign: 'right',
              }}>
                ${item.revenue.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
