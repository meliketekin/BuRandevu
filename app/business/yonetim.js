import { View, Text, StyleSheet } from 'react-native';
import useAuthStore from '@/store/auth-store';

export default function BusinessYonetim() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const title = isAdmin ? 'Yönetim' : 'Yönet';
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
  },
});
