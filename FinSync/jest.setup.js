import "react-native-gesture-handler/jestSetup";
import "@testing-library/jest-native/extend-expect";

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock Expo modules
jest.mock("expo-constants", () => ({
  Constants: {
    deviceId: "test-device-id",
    sessionId: "test-session-id",
  },
}));

jest.mock("expo-font", () => ({
  loadAsync: jest.fn(),
}));

jest.mock("expo-asset", () => ({
  Asset: {
    loadAsync: jest.fn(),
  },
}));

// Mock Expo vector icons
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const createMockIcon = (name) => {
    const MockIcon = (props) => {
      return React.createElement(
        Text,
        { ...props, testID: `${name}-icon` },
        props.name || "icon"
      );
    };
    MockIcon.displayName = `Mock${name}`;
    return MockIcon;
  };

  return new Proxy(
    {},
    {
      get: (target, prop) => {
        if (typeof prop === "string") {
          return createMockIcon(prop);
        }
        return target[prop];
      },
    }
  );
});

// Mock Font from expo-font
jest.mock("expo-font", () => ({
  ...jest.requireActual("expo-font"),
  Font: {
    isLoaded: jest.fn(() => true),
    loadAsync: jest.fn(() => Promise.resolve()),
  },
  loadAsync: jest.fn(),
}));

// Mock navigation
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

// Global test timeout
jest.setTimeout(10000);

// Mock console methods in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

global.__ExpoImportMetaRegistry = {};

// Mock Expo runtime to prevent import scope errors
jest.mock("expo", () => ({
  AppRegistry: {
    registerComponent: jest.fn(),
  },
}));

// Mock TextDecoder for expo runtime
global.TextDecoder = class TextDecoder {
  decode() {
    return "";
  }
};

// Mock expo router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Stack: {
    Screen: ({ children }) => children,
  },
  Tabs: {
    Screen: ({ children }) => children,
  },
}));
