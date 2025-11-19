import { auth } from "@/services/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { getApp } from "firebase/app";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import {
  Calendar,
  ChevronLeft,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PersonalInfoScreen = () => {
  const [userInfo, setUserInfo] = useState<any>({
    name: "Nguyễn Văn An",
    email: "nguyenvanan@example.com",
    phone: "0987654321",
    address: "123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh",
    dob: "01/01/1990",
    photoURL: null,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState<any>({ ...userInfo });
  const [loading, setLoading] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);

  const handleSave = () => {
    (async () => {
      setLoading(true);
      try {
        const current = auth.currentUser;
        // Update displayName in Firebase Auth if changed
        if (
          current &&
          editedInfo.name &&
          editedInfo.name !== current.displayName
        ) {
          // updateProfile will update displayName/photoURL only
          // Email changes require re-auth and are not handled here.
          // eslint-disable-next-line @typescript-eslint/await-thenable
          await updateProfile(current, { displayName: editedInfo.name });
        }

        // Persist additional profile fields to AsyncStorage keyed by uid
        const uid = current?.uid ?? "anonymous";
        const payload = {
          phone: editedInfo.phone,
          address: editedInfo.address,
          dob: editedInfo.dob,
          email: editedInfo.email,
        };
        await AsyncStorage.setItem(
          `@hofu:profile:${uid}`,
          JSON.stringify(payload)
        );

        // Reflect saved values in UI
        setUserInfo((prev: any) => ({ ...prev, ...editedInfo }));
        setIsEditing(false);
        Alert.alert("Thành công", "Thông tin đã được cập nhật");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Failed to save profile", e);
        Alert.alert("Lỗi", "Không thể lưu thông tin. Thử lại sau.");
      } finally {
        setLoading(false);
      }
    })();
  };

  // Load current user and any saved profile extras on mount
  useEffect(() => {
    let mounted = true;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!mounted) return;
      try {
        if (u) {
          const uid = u.uid;
          const raw = await AsyncStorage.getItem(`@hofu:profile:${uid}`);
          const extras = raw ? JSON.parse(raw) : {};
          const merged = {
            name: u.displayName ?? extras.name ?? userInfo.name,
            email: u.email ?? extras.email ?? userInfo.email,
            photoURL: u.photoURL ?? extras.photoURL ?? undefined,
            phone: extras.phone ?? userInfo.phone,
            address: extras.address ?? userInfo.address,
            dob: extras.dob ?? userInfo.dob,
          };
          setUserInfo(merged);
          setEditedInfo(merged);
        } else {
          // Not logged in: keep defaults
        }
      } catch (err) {
        // ignore but log
        // eslint-disable-next-line no-console
        console.warn("profile load error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // Pick an image, upload to Firebase Storage, update user's photoURL
  const handlePickAvatar = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Quyền truy cập bị từ chối",
          "Cần quyền truy cập ảnh để thay đổi đại diện."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      // new API returns { canceled, assets } or older { cancelled, uri }
      const uri = (result as any).assets?.[0]?.uri ?? (result as any).uri;
      if (!uri) return;

      const current = auth.currentUser;
      if (!current) {
        Alert.alert(
          "Chưa đăng nhập",
          "Vui lòng đăng nhập trước khi thay đổi ảnh đại diện."
        );
        return;
      }

      setPhotoUploading(true);

      // fetch blob and upload
      const resp = await fetch(uri);
      const blob = await resp.blob();

      const storage = getStorage(getApp());
      const storageRef = ref(storage, `avatars/${current.uid}/${Date.now()}`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      // update firebase profile
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await updateProfile(current, { photoURL: url });

      // persist photoURL with extras
      const raw = await AsyncStorage.getItem(`@hofu:profile:${current.uid}`);
      const extras = raw ? JSON.parse(raw) : {};
      await AsyncStorage.setItem(
        `@hofu:profile:${current.uid}`,
        JSON.stringify({ ...extras, photoURL: url })
      );

      // reflect in UI
      setUserInfo((prev: any) => ({ ...prev, photoURL: url }));
      setEditedInfo((prev: any) => ({ ...prev, photoURL: url }));
      Alert.alert("Thành công", "Ảnh đại diện đã được cập nhật");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("avatar upload failed", e);
      Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện. Thử lại sau.");
    } finally {
      setPhotoUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-green-600 pt-12 pb-6 px-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={28} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold flex-1 ml-4">
            Thông tin cá nhân
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* User Info Card */}
        <View className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <View className="items-center mb-6">
            <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-4 overflow-hidden">
              {userInfo.photoURL ? (
                <Image
                  source={{ uri: userInfo.photoURL }}
                  className="w-24 h-24"
                />
              ) : (
                <User size={48} color="#34C759" />
              )}
              <TouchableOpacity
                onPress={handlePickAvatar}
                className="absolute right-0 bottom-0 bg-white rounded-full p-1"
                accessibilityLabel="Thay ảnh đại diện"
              >
                {photoUploading ? (
                  <ActivityIndicator size="small" color="#06b35f" />
                ) : (
                  <Save size={16} color="#06b35f" />
                )}
              </TouchableOpacity>
            </View>
            <Text className="text-xl font-bold text-gray-800">
              {userInfo.name}
            </Text>
            <Text className="text-gray-600 mt-1">
              Thành viên của FoodExpress
            </Text>
          </View>

          {/* Info Fields */}
          <View className="space-y-4">
            <View className="flex-row items-center border-b border-gray-100 pb-3">
              <User size={20} color="#34C759" />
              <Text className="ml-3 text-gray-700 w-24">Họ và tên</Text>
              {isEditing ? (
                <TextInput
                  className="flex-1 p-2 border border-gray-300 rounded-lg"
                  value={editedInfo.name}
                  onChangeText={(text) =>
                    setEditedInfo({ ...editedInfo, name: text })
                  }
                />
              ) : (
                <Text className="flex-1 text-gray-800 font-medium">
                  {userInfo.name}
                </Text>
              )}
            </View>

            <View className="flex-row items-center border-b border-gray-100 pb-3">
              <Mail size={20} color="#34C759" />
              <Text className="ml-3 text-gray-700 w-24">Email</Text>
              {isEditing ? (
                <TextInput
                  className="flex-1 p-2 border border-gray-300 rounded-lg"
                  value={editedInfo.email}
                  onChangeText={(text) =>
                    setEditedInfo({ ...editedInfo, email: text })
                  }
                  keyboardType="email-address"
                />
              ) : (
                <Text className="flex-1 text-gray-800 font-medium">
                  {userInfo.email}
                </Text>
              )}
            </View>

            <View className="flex-row items-center border-b border-gray-100 pb-3">
              <Phone size={20} color="#34C759" />
              <Text className="ml-3 text-gray-700 w-24">Số điện thoại</Text>
              {isEditing ? (
                <TextInput
                  className="flex-1 p-2 border border-gray-300 rounded-lg"
                  value={editedInfo.phone}
                  onChangeText={(text) =>
                    setEditedInfo({ ...editedInfo, phone: text })
                  }
                  keyboardType="phone-pad"
                />
              ) : (
                <Text className="flex-1 text-gray-800 font-medium">
                  {userInfo.phone}
                </Text>
              )}
            </View>

            <View className="flex-row items-center border-b border-gray-100 pb-3">
              <MapPin size={20} color="#34C759" />
              <Text className="ml-3 text-gray-700 w-24">Địa chỉ</Text>
              {isEditing ? (
                <TextInput
                  className="flex-1 p-2 border border-gray-300 rounded-lg"
                  value={editedInfo.address}
                  onChangeText={(text) =>
                    setEditedInfo({ ...editedInfo, address: text })
                  }
                />
              ) : (
                <Text className="flex-1 text-gray-800 font-medium">
                  {userInfo.address}
                </Text>
              )}
            </View>

            <View className="flex-row items-center border-b border-gray-100 pb-3">
              <Calendar size={20} color="#34C759" />
              <Text className="ml-3 text-gray-700 w-24">Ngày sinh</Text>
              {isEditing ? (
                <TextInput
                  className="flex-1 p-2 border border-gray-300 rounded-lg"
                  value={editedInfo.dob}
                  onChangeText={(text) =>
                    setEditedInfo({ ...editedInfo, dob: text })
                  }
                />
              ) : (
                <Text className="flex-1 text-gray-800 font-medium">
                  {userInfo.dob}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mt-6">
          {isEditing ? (
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-xl py-4 items-center"
                onPress={() => setIsEditing(false)}
              >
                <Text className="text-gray-700 font-semibold">Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-green-600 rounded-xl py-4 items-center flex-row justify-center"
                onPress={handleSave}
              >
                <Save size={20} color="#fff" />
                <Text className="text-white font-semibold ml-2">Lưu</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="bg-green-600 rounded-xl py-4 items-center"
              onPress={() => setIsEditing(true)}
            >
              <Text className="text-white font-semibold">
                Chỉnh sửa thông tin
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default PersonalInfoScreen;
