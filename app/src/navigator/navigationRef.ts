import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: any) {
  if (!navigationRef.isReady()) {
    // Wait for navigation to be ready with retries
    let retries = 0;
    const maxRetries = 10;
    const checkAndNavigate = () => {
      if (navigationRef.isReady()) {
        try {
          navigationRef.dispatch(
            CommonActions.navigate({
              name: name as never,
              params: params as never,
            })
          );
        } catch (error: any) {
                    if (__DEV__) {
            console.error('❌ [Navigation] Error navigating:', error)
          };
        }
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(checkAndNavigate, 100);
      } else {
                if (__DEV__) {
          console.error('❌ [Navigation] Navigation not ready after', maxRetries, 'retries')
        };
      }
    };
    setTimeout(checkAndNavigate, 100);
    return;
  }

  try {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: name as never,
        params: params as never,
      })
    );
  } catch (error: any) {
        if (__DEV__) {
      console.error('❌ [Navigation] Error navigating:', error)
    };
    // Retry after a short delay
    setTimeout(() => {
      if (navigationRef.isReady()) {
        try {
          navigationRef.dispatch(
            CommonActions.navigate({
              name: name as never,
              params: params as never,
            })
          );
        } catch (retryError: any) {
                    if (__DEV__) {
            console.error('❌ [Navigation] Retry navigation failed:', retryError)
          };
        }
      }
    }, 500);
  }
}

export function getCurrentRoute() {
  if (navigationRef.isReady()) {
    const route = navigationRef.getCurrentRoute();
    if (route) {
      // Try to get nested route if we're on a nested navigator
      const state = navigationRef.getState();
      if (state && state.routes && state.index !== undefined) {
        const currentRoute = state.routes[state.index];
        if (currentRoute && currentRoute.state && currentRoute.state.routes && currentRoute.state.index !== undefined) {
          const nestedRoute = currentRoute.state.routes[currentRoute.state.index];
          if (nestedRoute && (nestedRoute.name === 'CallingScreen' || nestedRoute.name === 'VideoCallingScreen')) {
            return nestedRoute;
          }
        }
      }
    }
    return route;
  }
  return null;
}

