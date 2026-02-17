import React from 'react';
import { useRoute } from '@react-navigation/native';
import VideoUploadManager from './VideoUploadManager';

interface RouteParams {
  courseId: string;
}

export default function VideoUploadManagerWrapper() {
  const route = useRoute();
  const params = route.params as RouteParams;
  
  return (
    <VideoUploadManager
      courseId={params.courseId}
      onClose={() => {
        // Handle close - navigate back
      }}
      onComplete={() => {
        // Handle completion - navigate back or to next step
      }}
    />
  );
}
