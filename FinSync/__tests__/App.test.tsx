import React from "react";
import { render } from "@testing-library/react-native";
import RootLayout from "../app/_layout";

describe("App", () => {
  it("renders correctly", () => {
    render(<RootLayout />);
  });
});
