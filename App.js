import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getMovies } from "./api";

import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-community/masked-view";
import Svg, { Rect } from "react-native-svg";

import Rating from "./Rating";
import Genres from "./Genres";

const { width, height } = Dimensions.get("window");
const SPACING = 10;
const ITEM_SIZE = Platform.OS === "ios" ? width * 0.72 : width * 0.74;
const EMPTY_ITEM_SIZE = (width - ITEM_SIZE) / 2;
const BACKDROP_HEIGHT = height * 0.65;

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export default function App() {
  const [movies, setMovies] = useState([]);

  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchData = async () => {
      const movies = await getMovies();
      setMovies([{ key: "left_space" }, ...movies, { key: "right_side" }]);
    };

    if (movies.length === 0) {
      fetchData();
    }
  }, [movies]);

  if (movies.length === 0 || !movies) {
    return (
      <View style={{ justifyContent: "center", alignItems: "center", flex: 1 }}>
        <Text style={{ fontWeight: "bold" }}>Loading ...</Text>
      </View>
    );
  }

  const Backdrop = ({ movies, scrollX }) => {
    return (
      <View
        style={{
          position: "absolute",
          width: width,
          height: BACKDROP_HEIGHT,
          top: 0,
        }}
      >
        <FlatList
          data={movies}
          keyExtractor={(item) => item.key + "-backdrop"}
          removeClippedSubviews={false}
          contentContainerStyle={{ width, height: BACKDROP_HEIGHT }}
          renderItem={({ item, index }) => {
            if (!item.backdrop) {
              return null;
            }

            const translateX = scrollX.interpolate({
              inputRange: [(index - 2) * ITEM_SIZE, (index - 1) * ITEM_SIZE],
              outputRange: [0, width],
              // extrapolate:'clamp'
            });

            return (
              <Animated.View
                removeClippedSubviews={false}
                style={{
                  position: "absolute",
                  width: translateX,
                  height,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={{ uri: item.backdrop }}
                  style={{
                    width: width,
                    height: BACKDROP_HEIGHT,
                    position: "absolute",
                  }}
                />
              </Animated.View>
            );
          }}
        />
        <LinearGradient
          colors={["rgba(0, 0, 0, 0)", "white"]}
          style={{
            height: BACKDROP_HEIGHT,
            width,
            position: "absolute",
            bottom: 0,
          }}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden style="auto" />
      <Backdrop scrollX={scrollX} movies={movies} />
      <FlatList
        showsHorizontalScrollIndicator={false}
        data={movies}
        keyExtractor={(item) => item.key}
        horizontal
        bounces={false}
        decelerationRate={Platform.OS === "ios" ? 0 : 0.98}
        renderToHardwareTextureAndroid
        contentContainerStyle={{ alignItems: "center" }}
        snapToInterval={ITEM_SIZE}
        snapToAlignment="start"
        onScroll={Animated.event(
          // scrollX = e.nativeEvent.contentOffset.x
          [
            {
              nativeEvent: {
                contentOffset: {
                  x: scrollX,
                },
              },
            },
          ],
          {
            useNativeDriver: false,
          }
        )}
        snapToAlignment="start"
        renderItem={({ item, index }) => {
          if (!item.poster) {
            return (
              <View
                style={{
                  width: EMPTY_ITEM_SIZE,
                }}
              ></View>
            );
          }

          const inputRange = [
            (index - 2) * ITEM_SIZE,
            (index - 1) * ITEM_SIZE,
            index * ITEM_SIZE,
          ];

          const tansformY = scrollX.interpolate({
            inputRange,
            outputRange: [100, 50, 100],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              style={{
                width: ITEM_SIZE,
                transform: [
                  {
                    translateY: tansformY,
                  },
                ],
              }}
            >
              <View
                style={{
                  marginHorizontal: SPACING,
                  padding: SPACING * 2,
                  alignItems: "center",
                  backgroundColor: "white",
                  borderRadius: 34,
                }}
              >
                <Image
                  source={{ uri: item.poster }}
                  style={styles.posterImage}
                />
                <Text style={{ fontSize: 24 }} numberOfLines={1}>
                  {item.title}
                </Text>
                <Rating rating={item.rating} />
                <Genres genres={item.genres} />
                <Text style={{ fontSize: 12 }} numberOfLines={3}>
                  {item.description}
                </Text>
              </View>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  posterImage: {
    width: "100%",
    height: ITEM_SIZE * 1.2,
    resizeMode: "cover",
    borderRadius: 24,
    margin: 0,
    marginBottom: 10,
  },
});
