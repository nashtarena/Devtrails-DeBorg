import { View, Text, TouchableOpacity } from "react-native";
import { Icon } from "../components/Icon";

const NotFound = () => {
  return (
    <View className="flex-1 items-center justify-center px-6 bg-background">
      <View className="items-center space-y-6">
        {/* Icon */}
        <View className="w-24 h-24 rounded-full bg-si-red-50 items-center justify-center">
          <Icon name="error-outline" size={48} className="text-si-red-500" />
        </View>

        {/* Text */}
        <View className="items-center space-y-2">
          <Text className="text-2xl font-bold text-foreground text-center">Page Not Found</Text>
          <Text className="text-muted-foreground text-center leading-6">
            The page you're looking for doesn't exist or has been moved.
          </Text>
        </View>

        {/* Button */}
        <TouchableOpacity className="si-btn-primary px-8 py-3 rounded-xl">
          <Text className="text-primary-foreground font-semibold">Go Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NotFound;
