// rnfes
import { StyleSheet, Text, TouchableHighlight } from "react-native";
import React from "react";
import colors from "@/styles/colors";

type propsType = {
  title: string;
  color?: string; // optional prop, we will give it a default value
  textColor?: string; // optional
  underlayColor?: string;
  onPress: () => void;
};

const Button: React.FC<propsType> = ({
  title,
  color = colors.primary,
  textColor = colors.background,
  underlayColor = colors.darkgrey,
  onPress,
}) => {
  return (
    <TouchableHighlight
      style={[styles.buttonContainer, { backgroundColor: color }]}
      onPress={onPress}
      underlayColor={underlayColor}
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
    </TouchableHighlight>
  );
};

export default Button;

const styles = StyleSheet.create({
  buttonContainer: {
    height: 30,
    width: 120,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: colors.darkgrey,
    // justifyContent: "center",
    alignItems: "center",
    //marginStart: 10,
    marginTop: 10,
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 16,
  },
});
