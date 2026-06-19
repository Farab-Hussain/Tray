const makeResult = uri => ({
  didCancel: false,
  assets: [
    {
      uri,
      fileName: 'test-image.jpg',
      type: 'image/jpeg',
      fileSize: 1024,
    },
  ],
});

exports.launchImageLibrary = jest.fn((_options, callback) => {
  const result = makeResult('test-image-uri');
  if (typeof callback === 'function') {
    callback(result);
  }
  return Promise.resolve(result);
});

exports.launchCamera = jest.fn((_options, callback) => {
  const result = makeResult('test-camera-uri');
  if (typeof callback === 'function') {
    callback(result);
  }
  return Promise.resolve(result);
});
