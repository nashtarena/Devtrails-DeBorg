import { View, Text, TouchableOpacity } from "react-native";

const NotFound = () => {
  return (
    <View className="flex-1 items-center justify-center bg-muted">
      <View className="items-center">
        <Text className="text-4xl font-bold mb-4">404</Text>
        <Text className="text-xl text-muted-foreground mb-4">Oops! Page not found</Text>
        <TouchableOpacity>
          <Text className="text-primary underline">Return to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NotFound;