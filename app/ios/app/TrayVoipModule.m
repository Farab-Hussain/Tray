#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(TrayVoipModule, RCTEventEmitter)
RCT_EXTERN_METHOD(getVoipToken:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getPendingCallIntent:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(hasActiveCallKitCall:(NSString *)callId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(endCallKitCall:(NSString *)callId reason:(NSString *)reason resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(presentIncomingCall:(NSString *)callId callType:(NSString *)callType callerId:(NSString *)callerId receiverId:(NSString *)receiverId callerName:(NSString *)callerName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(presentOutgoingCall:(NSString *)callId callType:(NSString *)callType callerId:(NSString *)callerId receiverId:(NSString *)receiverId calleeName:(NSString *)calleeName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(reportCallKitConnected:(NSString *)callId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
@end
