import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ProgramListCardProps = {
  programId: string;
  programName: string;
  exerciseCount: number;
};

export function ProgramListCard({
  programId,
  programName,
  exerciseCount,
}: ProgramListCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Link href={`/(client)/program/${programId}` as any} asChild>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: `${colors.icon}15`,
          },
        ]}
      >
        <View style={styles.content}>
          <View
            style={[styles.iconWrap, { backgroundColor: `${colors.tint}20` }]}
          >
            <MaterialIcons
              name="fitness-center"
              size={24}
              color={colors.tint}
            />
          </View>
          <View style={styles.textWrap}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={2}
            >
              {programName}
            </Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              {exerciseCount} ushtrim{exerciseCount !== 1 ? "e" : ""}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: Typography.bodyLarge,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: Typography.small,
    marginTop: 2,
  },
});
