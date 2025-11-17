# Component Documentation

## Mobile App Components

### UI Components

#### AppButton
Reusable button component with customizable styles.

**Location:** `app/src/components/ui/AppButton.tsx`

**Props:**
- `title` (string, required) - Button text
- `onPress` (function, required) - Press handler
- `variant` (string, optional) - Button style variant
- `disabled` (boolean, optional) - Disable button
- `loading` (boolean, optional) - Show loading state

**Usage:**
```tsx
<AppButton
  title="Submit"
  onPress={handleSubmit}
  variant="primary"
  disabled={isLoading}
/>
```

---

#### ConsultantCard
Displays consultant information in a card format.

**Location:** `app/src/components/ui/ConsultantCard.tsx`

**Props:**
- `name` (string, required) - Consultant name
- `title` (string, required) - Consultant title/category
- `avatarUri` (object, required) - Avatar image source
- `rating` (number, optional) - Rating (0-5)
- `onBookPress` (function, required) - Book button handler
- `onChatPress` (function, optional) - Chat button handler
- `onCallPress` (function, optional) - Call button handler
- `onVideoCallPress` (function, optional) - Video call button handler

**Usage:**
```tsx
<ConsultantCard
  name="John Doe"
  title="Career Counselor"
  avatarUri={{ uri: "https://..." }}
  rating={4.5}
  onBookPress={() => navigate('Booking')}
  onChatPress={() => openChat()}
/>
```

---

#### ServiceCard
Displays service information in a card format.

**Location:** `app/src/components/ui/ServiceCard.tsx`

**Props:**
- `title` (string, required) - Service title
- `description` (string, required) - Service description
- `price` (number, required) - Service price
- `duration` (number, required) - Duration in minutes
- `imageUri` (object, optional) - Service image
- `consultant` (object, optional) - Consultant information
- `onPress` (function, required) - Card press handler

**Usage:**
```tsx
<ServiceCard
  title="Career Counseling"
  description="Professional career guidance"
  price={100}
  duration={60}
  imageUri={{ uri: "https://..." }}
  onPress={() => navigate('Booking')}
/>
```

---

#### ReviewCard
Displays a review in a card format.

**Location:** `app/src/components/ui/ReviewCard.tsx`

**Props:**
- `review` (object, required) - Review data
- `showActions` (boolean, optional) - Show edit/delete actions
- `isOwnReview` (boolean, optional) - Is this user's own review
- `mode` (string, optional) - Display mode

**Usage:**
```tsx
<ReviewCard
  review={{
    id: "review-id",
    rating: 5,
    comment: "Great service!",
    studentName: "Student Name"
  }}
  showActions={true}
  isOwnReview={false}
/>
```

---

#### Message
Displays a chat message.

**Location:** `app/src/components/ui/Message.tsx`

**Props:**
- `message` (object, required) - Message data
- `isOwn` (boolean, required) - Is this user's own message
- `senderName` (string, optional) - Sender name
- `senderAvatar` (object, optional) - Sender avatar

**Usage:**
```tsx
<Message
  message={{
    text: "Hello!",
    createdAt: "2024-01-15T10:00:00Z",
    senderId: "user-id"
  }}
  isOwn={false}
  senderName="John Doe"
/>
```

---

#### NotificationItem
Displays a notification item.

**Location:** `app/src/components/ui/NotificationItem.tsx`

**Props:**
- `notification` (object, required) - Notification data
- `onPress` (function, optional) - Press handler
- `onMarkAsRead` (function, optional) - Mark as read handler

**Usage:**
```tsx
<NotificationItem
  notification={{
    id: "notif-id",
    title: "New Message",
    body: "You have a new message",
    type: "chat_message",
    read: false
  }}
  onPress={() => navigate('Chat')}
/>
```

---

#### ImageUpload
Image upload component with preview.

**Location:** `app/src/components/ui/ImageUpload.tsx`

**Props:**
- `onImageSelected` (function, required) - Callback when image is selected
- `currentImageUri` (string, optional) - Current image URI
- `label` (string, optional) - Upload label
- `aspectRatio` (number, optional) - Image aspect ratio

**Usage:**
```tsx
<ImageUpload
  onImageSelected={(uri) => setImage(uri)}
  currentImageUri={profileImage}
  label="Upload Profile Image"
  aspectRatio={1}
/>
```

---

#### Loader
Loading spinner component.

**Location:** `app/src/components/ui/Loader.tsx`

**Props:**
- `size` (string, optional) - Size: "small" | "large" (default: "large")
- `color` (string, optional) - Spinner color

**Usage:**
```tsx
<Loader size="large" color={COLORS.green} />
```

---

#### CustomAlert
Custom alert dialog component.

**Location:** `app/src/components/ui/CustomAlert.tsx`

**Props:**
- `visible` (boolean, required) - Show/hide alert
- `title` (string, required) - Alert title
- `message` (string, required) - Alert message
- `onConfirm` (function, required) - Confirm handler
- `onCancel` (function, optional) - Cancel handler
- `confirmText` (string, optional) - Confirm button text
- `cancelText` (string, optional) - Cancel button text

**Usage:**
```tsx
<CustomAlert
  visible={showAlert}
  title="Confirm"
  message="Are you sure?"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

---

#### PaymentModal
Payment processing modal.

**Location:** `app/src/components/ui/PaymentModal.tsx`

**Props:**
- `visible` (boolean, required) - Show/hide modal
- `amount` (number, required) - Payment amount
- `onPaymentSuccess` (function, required) - Success handler
- `onClose` (function, required) - Close handler
- `bookingId` (string, optional) - Associated booking ID

**Usage:**
```tsx
<PaymentModal
  visible={showPayment}
  amount={100}
  onPaymentSuccess={handleSuccess}
  onClose={handleClose}
  bookingId="booking-id"
/>
```

---

### Shared Components

#### ScreenHeader
Reusable screen header with back button.

**Location:** `app/src/components/shared/ScreenHeader.tsx`

**Props:**
- `title` (string, required) - Header title
- `onBackPress` (function, required) - Back button handler
- `rightComponent` (ReactNode, optional) - Right side component

**Usage:**
```tsx
<ScreenHeader
  title="Consultants"
  onBackPress={() => navigation.goBack()}
/>
```

---

#### SearchBar
Search input component.

**Location:** `app/src/components/shared/SearchBar.tsx`

**Props:**
- `value` (string, required) - Search value
- `onChangeText` (function, required) - Text change handler
- `placeholder` (string, optional) - Placeholder text
- `onClear` (function, optional) - Clear handler

**Usage:**
```tsx
<SearchBar
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Search..."
  onClear={() => setSearchQuery('')}
/>
```

---

#### HomeHeader
Home screen header component.

**Location:** `app/src/components/shared/HomeHeader.tsx`

**Props:**
- `userName` (string, required) - User's name
- `onProfilePress` (function, optional) - Profile button handler

**Usage:**
```tsx
<HomeHeader
  userName="John Doe"
  onProfilePress={() => navigate('Profile')}
/>
```

---

### Consultant Components

#### ServiceApplicationForm
Form for applying to consultant services.

**Location:** `app/src/components/consultant/ServiceApplicationForm.tsx`

**Props:**
- `serviceId` (string, required) - Service ID to apply for
- `onSubmit` (function, required) - Submit handler
- `onCancel` (function, optional) - Cancel handler

**Usage:**
```tsx
<ServiceApplicationForm
  serviceId="service-id"
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

---

#### StepIndicator
Multi-step form indicator.

**Location:** `app/src/components/consultant/StepIndicator.tsx`

**Props:**
- `currentStep` (number, required) - Current step (1-based)
- `totalSteps` (number, required) - Total number of steps
- `steps` (array, optional) - Step labels

**Usage:**
```tsx
<StepIndicator
  currentStep={2}
  totalSteps={4}
  steps={["Profile", "Services", "Availability", "Review"]}
/>
```

---

#### StatusComponents
Components for displaying consultant status.

**Location:** `app/src/components/consultant/StatusComponents.tsx`

**Exports:**
- `PendingApprovalStatus` - Shows pending approval message
- `ApprovedStatus` - Shows approved status
- `RejectedStatus` - Shows rejected status with reason

**Usage:**
```tsx
import { PendingApprovalStatus } from '../components/consultant/StatusComponents';

<PendingApprovalStatus message="Your profile is under review" />
```

---

## Web Dashboard Components

### Admin Components

Located in `web/components/admin/`

- `UserManagement` - User list and management
- `ServiceApplications` - Service application review
- `ConsultantProfiles` - Consultant profile management
- `Analytics` - Analytics dashboard
- `Settings` - Platform settings

### Consultant Components

Located in `web/components/consultant/`

- `ConsultantDashboard` - Consultant dashboard
- `ServiceManagement` - Service management interface
- `ApplicationStatus` - Application status display

### Shared Components

Located in `web/components/shared/`

- `Layout` - Page layout wrapper
- `Navigation` - Navigation component
- `DataTable` - Data table component

---

## Component Patterns

### State Management
Components use React hooks for state management:
- `useState` for local state
- `useContext` for global state (AuthContext, ChatContext, etc.)
- `useCallback` for memoized functions
- `useEffect` for side effects

### Navigation
Components use React Navigation:
- `useNavigation` hook for navigation
- `useRoute` hook for route params
- `useFocusEffect` for screen focus events

### Styling
Components use StyleSheet API:
- Styles defined in `constants/styles/`
- Reusable style objects
- Theme colors from `constants/core/colors.ts`

---

## Best Practices

1. **Props Validation**: Use TypeScript for type checking
2. **Error Handling**: Always handle errors gracefully
3. **Loading States**: Show loading indicators for async operations
4. **Accessibility**: Use accessible labels and hints
5. **Performance**: Memoize expensive computations
6. **Reusability**: Create reusable components for common patterns

---

## Component Testing

Components should be tested with:
- Unit tests for logic
- Integration tests for interactions
- Snapshot tests for UI consistency

Example test structure:
```typescript
describe('ConsultantCard', () => {
  it('renders consultant information correctly', () => {
    // Test implementation
  });
  
  it('calls onBookPress when book button is pressed', () => {
    // Test implementation
  });
});
```

