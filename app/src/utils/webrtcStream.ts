/**
 * URL/id passed to RTCView.streamURL. Android requires MediaStream.toURL().
 */
export function getMediaStreamRenderURL(stream: any): string | undefined {
  if (!stream) {
    return undefined;
  }
  if (typeof stream.toURL === 'function') {
    return stream.toURL();
  }
  return stream.id;
}
