const React = require('react');
const { Text } = require('react-native');

const Icon = ({ testID, ...props }) => React.createElement(Text, { testID, ...props }, '');

module.exports = new Proxy(
  {},
  {
    get: (_target, prop) => {
      if (prop === '__esModule') {
        return true;
      }
      return Icon;
    },
  },
);
