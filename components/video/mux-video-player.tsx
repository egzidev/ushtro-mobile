import React, { useState } from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useVideoPlayer, VideoView } from "expo-video";

type MuxVideoPlayerProps = {
  playbackId: string;
  style?: object;
  contentFit?: "contain" | "cover";
};

export function MuxVideoPlayer({
  playbackId,
  style,
  contentFit = "contain",
}: MuxVideoPlayerProps) {
  const [showPoster, setShowPoster] = useState(true);

  const videoSource = `https://stream.mux.com/${playbackId}.m3u8`;
  const posterSource = `https://image.mux.com/${playbackId}/thumbnail.jpg?time=0`;

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.muted = false;
  });

  const handlePosterPress = () => {
    setShowPoster(false);
    player.play();
  };

  return (
    <View style={[styles.container, style]}>
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls
        contentFit={contentFit}
      />
      {showPoster && (
        <Pressable onPress={handlePosterPress} style={styles.poster}>
          <Image
            source={{ uri: posterSource }}
            style={styles.posterImage}
            resizeMode="cover"
          />
          <View style={styles.playOverlay}>
            <MaterialIcons
              name="play-circle-filled"
              size={72}
              color="rgba(255,255,255,0.95)"
            />
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
    aspectRatio: 16 / 9,
    backgroundColor: "#1a1a1a",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
  },
  posterImage: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
});
