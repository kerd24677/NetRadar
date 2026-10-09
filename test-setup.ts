import "@testing-library/jest-dom";
import "fake-indexeddb/auto";

// Mock matchMedia for tests
if (typeof window !== "undefined") {
  window.matchMedia =
    window.matchMedia ||
    function () {
      return {
        matches: false,
        addListener: function () {},
        removeListener: function () {},
        addEventListener: function () {},
        removeEventListener: function () {},
        dispatchEvent: function () {
          return false;
        },
      };
    };
}
