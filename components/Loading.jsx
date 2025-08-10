import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import React from 'react';
import colors from "@/styles/colors";

const Loading = ({size="large", color=colors.secondary}) => {
    return (
        <View style={{justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size={size} color={color} />
        </View>
    )
}

export default Loading

const styles= StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#BFC7BA",
        paddingHorizontal: 20,
        paddingTop: 60,
      },
})