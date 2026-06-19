const React = require('react');

const stripe = {
  initPaymentSheet: jest.fn(() => Promise.resolve({ error: null })),
  presentPaymentSheet: jest.fn(() => Promise.resolve({ error: null })),
};

module.exports = {
  StripeProvider: ({ children }) => React.createElement(React.Fragment, null, children),
  useStripe: () => stripe,
  __stripe: stripe,
};
