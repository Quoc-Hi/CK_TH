import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { initDatabase } from "@/db/db";

export default function Page() {
  const [dbStatus, setDbStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const initializeDB = async () => {
      try {
        await initDatabase();
        setDbStatus("success");
        console.log("Database initialized successfully");
      } catch (error) {
        console.error("Database initialization error:", error);
        setDbStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      }
    };

    initializeDB();
  }, []);

  return (
    <View className="flex flex-1">
      <Header />
      <Content dbStatus={dbStatus} errorMessage={errorMessage} />
      <Footer />
    </View>
  );
}

function Content({ dbStatus, errorMessage }: { dbStatus: "loading" | "success" | "error"; errorMessage: string }) {
  return (
    <View className="flex-1">
      <View className="py-12 md:py-24 lg:py-32 xl:py-48">
        <View className="px-4 md:px-6">
          <View className="flex flex-col items-center gap-4 text-center">
            <Text
              role="heading"
              className="text-3xl text-center native:text-5xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl"
            >
              Movie Watchlist
            </Text>
            <Text className="mx-auto max-w-[700px] text-lg text-center text-gray-500 md:text-xl dark:text-gray-400">
              Quản lý danh sách phim cần xem/đã xem
            </Text>

            <View className="mt-8 flex flex-col items-center gap-4">
              {dbStatus === "loading" && (
                <View className="flex flex-col items-center gap-2">
                  <ActivityIndicator size="large" color="#000" />
                  <Text className="text-gray-600">Đang khởi tạo database...</Text>
                </View>
              )}
              {dbStatus === "success" && (
                <View className="flex flex-col items-center gap-2">
                  <Text className="text-green-600 font-semibold">✓ Database đã kết nối thành công!</Text>
                </View>
              )}
              {dbStatus === "error" && (
                <View className="flex flex-col items-center gap-2">
                  <Text className="text-red-600 font-semibold">✗ Lỗi kết nối database</Text>
                  <Text className="text-red-500 text-sm">{errorMessage}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function Header() {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: top }}>
      <View className="px-4 lg:px-6 h-14 flex items-center flex-row justify-between ">
        <Text className="font-bold flex-1 items-center justify-center text-xl">
          Movie Watchlist
        </Text>
      </View>
    </View>
  );
}

function Footer() {
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      className="flex shrink-0 bg-gray-100 native:hidden"
      style={{ paddingBottom: bottom }}
    >
      <View className="py-6 flex-1 items-start px-4 md:px-6 ">
        <Text className={"text-center text-gray-700"}>
          © {new Date().getFullYear()} Me
        </Text>
      </View>
    </View>
  );
}
