import { StyleSheet } from "react-native";
import colors from "./colors";

const defaultStyles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: colors.darkbackground,
    justifyContent: "center",
    alignItems: "center",
  },
  titleText: {
    fontSize: 36,
    color: colors.textondark,
  },
  bodyText: {
    fontSize: 20,
    color: colors.textondark,
  },
  inputBoxes: {
    padding: 5,
    width: 300,
    height: 40,
    marginVertical: 5,
    borderWidth: 2,
    fontSize: 16,
    color: colors.primarylight,
    borderRadius: 5,
  },
});

export default defaultStyles;
