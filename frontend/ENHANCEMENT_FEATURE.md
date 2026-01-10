# Enhancement Feature Implementation

## Overview
Implemented a comprehensive enhancement feature for all card types (Itinerary, Bus, and Accommodation) with animated feedback and backend integration.

## Features Implemented

### 1. **Itinerary Card Enhancement**
- **Location**: `src/components/ItineraryCard.tsx` & `src/pages/ChatPage.tsx`
- **Functionality**:
  - Click "Enhance" button to reveal text input
  - Enter custom places or preferences
  - Click "Add" button to submit enhancement request
  - Card displays blinking/fading animation during processing
  - Text input disappears when processing starts
  - Loading indicator shows "Enhancing your plan..."
  - Backend receives: `card_index`, `plan_details`, and `user_enhance` text
  - Response updates the specific card with new plan data

### 2. **Bus Card Enhancement**
- **Location**: `src/components/BusCard.tsx` & `src/pages/ChatPage.tsx`
- **Functionality**:
  - "Enhance Route" button below booking section
  - Similar animation and loading states as Itinerary
  - Backend endpoint: `/api/enhance_bus`
  - Sends: `card_index`, `route_name`, `route_details`, `user_enhance`
  - Updates bus routes on response

### 3. **Accommodation Card Enhancement**
- **Location**: `src/components/AccommodationCard.tsx` & `src/pages/ChatPage.tsx`
- **Functionality**:
  - "Enhance" button in action buttons section
  - Similar animation and loading states
  - Backend endpoint: `/api/enhance_accommodation`
  - Sends: `card_index`, `accommodation_details`, `user_enhance`
  - Updates accommodation list on response

## Animation States

### 1. **Blinking Animation**
- Opacity cycles: `1 → 0.6 → 1`
- Duration: 1.5 seconds per cycle
- Repeats infinitely until response received
- Border changes to primary color with pulse effect

### 2. **Input States**
- **Default**: "Enhance" button visible
- **Active**: Text input field appears below card
- **Processing**: Input disappears, loader appears
- **Complete**: Returns to default state

### 3. **Loader Animation**
- Spinning loader icon
- Custom message for each card type:
  - Itinerary: "Enhancing your plan..."
  - Bus: "Enhancing your route..."
  - Accommodation: "Finding better options..."
- Primary color theme with background highlight

## Backend Integration

### API Endpoints Expected

#### 1. Itinerary Enhancement
```
POST http://127.0.0.1:5001/api/enhance

Request Body: {
  card_index: number,
  plan_details: {
    title: string,
    duration: number,
    trip_details: object,
    hotel: object,
    optimized_routes: object
  },
  user_enhance: string,
  query_en: string  // Original query used to create the plan
}

Example Request:
{
  "card_index": 1,
  "plan_details": {
    "title": "Yoga & Wellness Retreat in Goa",
    "duration": 5,
    "trip_details": {...},
    "hotel": {...},
    "optimized_routes": {...}
  },
  "user_enhance": "add more adventure activities",
  "query_en": "plan a yoga trip to goa"
}

Response: {
  id: string,
  plan: {
    trip_details: object,
    hotel: object,
    optimized_routes: object
  }
}
```

#### 2. Bus Enhancement
```
POST http://127.0.0.1:5001/api/enhance_bus
Body: {
  card_index: number,
  route_name: string,
  route_details: object,
  user_enhance: string
}

Response: {
  id: string,
  routes: object
}
```

#### 3. Accommodation Enhancement
```
POST http://127.0.0.1:5001/api/enhance_accommodation
Body: {
  card_index: number,
  accommodation_details: object,
  user_enhance: string
}

Response: {
  id: string,
  accommodations: array
}
```

## Original Query Tracking

When plan cards are generated from a user query (e.g., "plan a yoga trip to goa"), the system:
1. Stores the original query in `originalPlanQuery` state
2. This happens when `response_type === "plans"` is received from backend
3. The query is preserved for all subsequent enhancement requests
4. Backend receives this query as `query_en` to maintain context

**Why this matters**: The backend needs the original user intent to make relevant enhancements. For example, if the original query was "plan a yoga trip to goa", and the user enhances with "add more adventure activities", the backend understands it's a yoga-focused trip in Goa that needs adventure elements added.

## State Management

### ChatPage State Variables
- `enhancingCardIndex`: Tracks which itinerary card is being enhanced
- `enhancingBusIndex`: Tracks which bus card is being enhanced
- `enhancingAccommodationIndex`: Tracks which accommodation card is being enhanced
- `originalPlanQuery`: Stores the original query that generated the plan cards (set when plans are received)

### Props Flow
1. **ChatPage** maintains enhancement state
2. Passes `isEnhancing` prop to each card
3. Passes `onEnhance` handler to trigger enhancement
4. Card components handle local input state
5. Card triggers handler on "Add" button click
6. ChatPage makes API call and updates data

## User Experience Flow

1. User clicks "Enhance" button on any card
2. Text input appears with placeholder: "Add custom places or preferences..."
3. User types enhancement request (e.g., "Add more adventure activities")
4. User presses Enter or clicks "Add" button
5. Input field disappears immediately
6. Card starts blinking/fading animation
7. Loader appears below card with processing message
8. Backend processes request
9. Response received and card data updated
10. Animation stops, loader disappears
11. Success message appears in chat
12. Card displays updated information

## Error Handling
- Network errors show warning message in chat
- Missing backend shows connection error
- Invalid responses show warning about missing data
- All errors stop the loading animation
- Card returns to normal state on error

## Animation Performance
- Uses `framer-motion` for smooth animations
- Hardware-accelerated opacity transitions
- `AnimatePresence` for enter/exit animations
- Responsive to user interactions
- No layout shift during state changes

## Styling
- Consistent with existing card design
- Primary color theme for enhancement states
- Rounded corners and modern UI
- Smooth transitions between states
- Mobile-responsive layouts

## Testing Recommendations
1. Test with and without backend running
2. Test rapid enhancement requests
3. Test with slow network conditions
4. Verify card updates correctly
5. Check animation smoothness
6. Test on different screen sizes
7. Verify keyboard shortcuts (Enter key)
