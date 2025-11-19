import React, { PropsWithChildren, ReactElement } from "react";
import {
  ImageResizeMode,
  ImageSourcePropType,
  ImageStyle,
  Image as RNImage,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";

import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";

const DEFAULT_HEADER_HEIGHT = 250;

type HeaderBackgroundColor = { type: "color"; color?: string };
type HeaderBackgroundImage = {
  type: "image";
  source: ImageSourcePropType;
  resizeMode?: ImageResizeMode;
};

type HeaderBackground = HeaderBackgroundColor | HeaderBackgroundImage;

type Props = PropsWithChildren<{
  headerHeight?: number;
  headerBackground?: HeaderBackground;
  /**
   * Optional overlay content rendered on top of the header background.
   * Can be a React element or a render function that returns one.
   */
  renderHeaderOverlay?: ReactElement | (() => ReactElement | null);
  /**
   * How strongly the overlay should parallax relative to the header.
   * 1 = same motion as header; >1 = moves more; 0 = fixed.
   */
  overlayParallaxFactor?: number;
  /**
   * Optional styles applied to header container, header overlay and header image.
   */
  headerStyle?: StyleProp<ViewStyle>;
  headerOverlayStyle?: StyleProp<ViewStyle>;
  headerImageStyle?: StyleProp<ImageStyle>;
}>;

export default function CustomParallaxLayout({
  children,
  headerBackground,
  headerHeight = DEFAULT_HEADER_HEIGHT,
  renderHeaderOverlay,
  overlayParallaxFactor = 1,
  headerStyle,
  headerOverlayStyle,
  headerImageStyle,
}: Props) {
  const backgroundColor = useThemeColor({}, "background");
  const colorScheme = useColorScheme() ?? "light";

  // No Reanimated transforms: header and overlay will scroll naturally with the ScrollView
  const renderBackground = () => {
    if (!headerBackground) return null;
    if (headerBackground.type === "color") {
      // prefer provided color, otherwise use themed background
      const color = headerBackground.color ?? (backgroundColor as string);
      return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: color }]} />
      );
    }

    // image
    const { source, resizeMode } = headerBackground as HeaderBackgroundImage;
    return (
      <RNImage
        source={source}
        style={[StyleSheet.absoluteFill, headerImageStyle]}
        resizeMode={resizeMode ?? "cover"}
      />
    );
  };

  const overlayElement =
    typeof renderHeaderOverlay === "function"
      ? renderHeaderOverlay()
      : renderHeaderOverlay || null;

  // If a solid header color is provided, use it as the ScrollView background
  const scrollBackgroundColor =
    headerBackground &&
    (headerBackground as HeaderBackgroundColor).type === "color"
      ? ((headerBackground as HeaderBackgroundColor).color ??
        (backgroundColor as string))
      : (backgroundColor as string);

  return (
    <Animated.ScrollView
      style={{ backgroundColor: scrollBackgroundColor, flex: 1 }}
      // ensure the scroll view's content area (including overscroll) uses the header/background color
      contentContainerStyle={{
        backgroundColor: scrollBackgroundColor,
        flexGrow: 1,
      }}
      // allow bounce/overscroll but keep background visible
      bounces={true}
      scrollEventThrottle={16}
    >
      <View style={[styles.header, { height: headerHeight }, headerStyle]}>
        {renderBackground()}
        <View style={[styles.headerOverlay, headerOverlayStyle]}>
          {overlayElement}
        </View>
      </View>

      <ThemedView style={styles.content} className="bg-white">
        {children}
      </ThemedView>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    padding: 12,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
});
