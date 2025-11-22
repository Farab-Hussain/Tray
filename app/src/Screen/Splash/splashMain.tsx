import { Image, View, Text } from 'react-native';
import AppButton from '../../components/ui/AppButton';
import { globalStyles } from '../../constants/core/global';
import { useAuth } from '../../contexts/AuthContext';


const SplashMain = ({navigation}:any) => {
  const { setIntendedRole } = useAuth();
  
  return (
  <View style={globalStyles.splash}>
      <Image
        source={require('../../assets/image/logo.png')}
        style={globalStyles.logo}
        resizeMode="contain"
      />
      <View style={globalStyles.ButtonContainer}>
        <Text style={globalStyles.heading}>Let's get started</Text>
        <AppButton
          title="REGISTER AS CONSULTANT"
          onPress={() => {
            console.log('Splash Screen - REGISTER AS CONSULTANT clicked, role: consultant');
            setIntendedRole('consultant');
            navigation.navigate('Auth', { 
              screen: 'Register',
              params: { role: 'consultant' }
            });
          }}
          style={globalStyles.blackButton}
          textStyle={globalStyles.buttonTextWhite}
        />
        <AppButton
          title="REGISTER AS STUDENT"
          onPress={() => {
            console.log('Splash Screen - REGISTER clicked, role: student');
            setIntendedRole('student');
            navigation.navigate('Auth', { 
              screen: 'Register',
              params: { role: 'student' }
            });
          }}
          style={globalStyles.yellowButton}
          textStyle={globalStyles.buttonTextBlack}
        />
        <AppButton
          title="REGISTER AS RECRUITER"
          onPress={() => {
            console.log('Splash Screen - REGISTER AS RECRUITER clicked, role: recruiter');
            setIntendedRole('recruiter');
            navigation.navigate('Auth', { 
              screen: 'Register',
              params: { role: 'recruiter' }
            });
          }}
          style={globalStyles.blackButton}
          textStyle={globalStyles.buttonTextWhite}
        />
      </View>
    </View>
  );
};

export default SplashMain;
