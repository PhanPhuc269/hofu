import Constants from "expo-constants";


export function getExtra(): any {
  return Constants.expoConfig?.extra || {};
}
