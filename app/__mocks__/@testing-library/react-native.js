const React = require('react');
const renderer = require('react-test-renderer');
const { act } = renderer;

const nodeText = node => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (!node || !node.children) {
    return '';
  }
  return node.children.map(nodeText).join('');
};

const matches = (value, matcher) => {
  if (matcher instanceof RegExp) {
    return matcher.test(value);
  }
  return value === String(matcher);
};

const createQueries = instance => {
  const getByText = matcher => {
    const found = instance.root.findAll(node => matches(nodeText(node), matcher));
    if (!found.length) {
      throw new Error(`Unable to find text: ${matcher}`);
    }
    return found[0];
  };

  const queryByText = matcher => {
    try {
      return getByText(matcher);
    } catch {
      return null;
    }
  };

  const getByTestId = testID => {
    return instance.root.findByProps({ testID });
  };

  const queryByTestId = testID => {
    try {
      return getByTestId(testID);
    } catch {
      return null;
    }
  };

  const getByPlaceholderText = placeholder => {
    return instance.root.findByProps({ placeholder });
  };

  const queryByPlaceholderText = placeholder => {
    try {
      return getByPlaceholderText(placeholder);
    } catch {
      return null;
    }
  };

  return {
    getByText,
    queryByText,
    getByTestId,
    queryByTestId,
    getByPlaceholderText,
    queryByPlaceholderText,
  };
};

const screen = {};

const render = element => {
  let instance;
  act(() => {
    instance = renderer.create(element);
  });

  const queries = createQueries(instance);
  Object.assign(screen, queries);

  return {
    ...queries,
    root: instance.root,
    toJSON: () => instance.toJSON(),
    unmount: () => instance.unmount(),
    update: nextElement => act(() => instance.update(nextElement)),
    rerender: nextElement => act(() => instance.update(nextElement)),
  };
};

const fireEvent = (element, eventName, ...args) => {
  const propName = eventName.startsWith('on')
    ? eventName
    : `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
  const handler = element?.props?.[propName];
  if (typeof handler === 'function') {
    act(() => {
      handler(...args);
    });
  }
};

fireEvent.press = (element, ...args) => fireEvent(element, 'press', ...args);
fireEvent.changeText = (element, text) => fireEvent(element, 'changeText', text);

const waitFor = async callback => {
  let lastError;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      return callback();
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  throw lastError;
};

module.exports = {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
};
