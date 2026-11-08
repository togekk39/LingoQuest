import AsyncStorage from '@react-native-async-storage/async-storage';
export const getRaw = (key: string) => AsyncStorage.getItem(key);
export const putRaw = (key: string, value: string) => AsyncStorage.setItem(key, value);
export const keysRaw = () => AsyncStorage.getAllKeys();
export const removeRaw = (keys: string[]) => AsyncStorage.multiRemove(keys);
