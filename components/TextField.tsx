import { View, TextInput } from "react-native";
import React from "react";

import defaultStyles from "@/styles/defaultStyles";
import colors from "@/styles/colors";
/*
This component is similar to the TextInput but allows
the user to pass in a state var and its update function
*/

type propsType = {
  placeholder: string;
  placeholderTextColor?: string;
  borderColor?: string;
  value: string; // The current value of the TextField
  onChangeText: (newValue: string) => void; // The function to update the value
};

const TextField: React.FC<propsType> = ({
  placeholder,
  placeholderTextColor = colors.defaultTextColor,
  borderColor = colors.textBoxColor,
  value,
  onChangeText,
}) => {
  return (
    <View>
      <TextInput
        style={[defaultStyles.inputBoxes, { borderColor: borderColor, backgroundColor: colors.textBoxColor }]}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

export default TextField;
