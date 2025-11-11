import { useEffect, RefObject } from 'react';

/**
 * Hook to handle keyboard behavior on web - scrolls input into view when focused
 * This is the web equivalent of React Native's KeyboardAvoidingView
 */
export const useKeyboardAvoidance = (
  inputRefs: Array<RefObject<HTMLInputElement | HTMLTextAreaElement | null>>
) => {
  useEffect(() => {
    const handleInputFocus = (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
      
      // Check if the focused element is one of our tracked inputs
      const isTrackedInput = inputRefs.some(ref => ref.current === target);
      
      if (isTrackedInput && target) {
        // Small delay to ensure keyboard is shown on mobile
        setTimeout(() => {
          target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }, 300);
      }
    };

    // Add event listeners to all tracked inputs
    const inputs = inputRefs
      .map(ref => ref.current)
      .filter((input): input is HTMLInputElement | HTMLTextAreaElement => 
        input !== null && (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)
      );

    inputs.forEach(input => {
      input.addEventListener('focus', handleInputFocus);
    });

    // Cleanup
    return () => {
      inputs.forEach(input => {
        input.removeEventListener('focus', handleInputFocus);
      });
    };
  }, [inputRefs]);
};

