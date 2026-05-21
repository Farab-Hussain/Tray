#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TrayVoipModule, NSObject)
RCT_EXTERN_METHOD(getVoipToken:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getPendingCallIntent:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
@end
