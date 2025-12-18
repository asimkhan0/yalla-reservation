# Feature Roadmap & Release Plan

This document outlines the proposed new features and improvements for the Yalla Reservation platform.

## 🚀 Phase 1: Core Experience Enhancements (Next Release)

Focus: Improving reliability and the booking experience.

- **🎙️ Voice Note Support (WhatsApp)**
  - **Feature**: Allow users to send voice notes for bookings.
  - **Tech**: OpenAI Whisper API integration to transcribe audio to text before processing by the agent.
  - **Benefit**: Faster interaction for users on the go.

- **🖼️ Rich Menu Integration**
  - **Feature**: Send PDF or Image menus via WhatsApp when asked.
  - **Tech**: `uploads` module enhancement + Twilio Media messages.
  - **Benefit**: Better user experience, keeps users in the chat.

- **📅 Calendar Integration (User Side)**
  - **Feature**: Send an .ics file or Google Calendar link upon confirmed booking.
  - **Tech**: `ics` library or simple link generation.
  - **Benefit**: Reduces no-shows.

## 💳 Phase 2: Monetization & Business Value

Focus: Helping restaurants secure revenue and manage operations.

- **🔒 Deposit / Pre-payments**
  - **Feature**: Secure a table with a credit card hold or deposit.
  - **Tech**: Stripe or Razorpay integration. Link sent via WhatsApp.
  - **Benefit**: Drastically reduces no-shows and cancellations.

- **📊 Advanced Analytics Dashboard**
  - **Feature**: insights on "Peak Hours", "Most Loyal Customers", "Agent Conversion Rate".
  - **Tech**: New `Analytics` module in API, Charts in Dashboard (Recharts/Tremor).
  - **Benefit**: Data-driven decisions for restaurant owners.

- **🍽️ Visual Table Management**
  - **Feature**: Drag-and-drop view of tables and reservations for the specific night.
  - **Tech**: Canvas/Interactive UI in Dashboard.
  - **Benefit**: Replaces physical reservation books.

## 🌐 Phase 3: Expansion & Scale

Focus: Growing the platform's reach.

- **🐙 Multi-Channel Support**
  - **Feature**: One inbox for WhatsApp, Instagram Direct, and Facebook Messenger.
  - **Tech**: Twilio Conversations API or Meta Business SDK.
  - **Benefit**: Capture bookings from all social channels.

- **🗣️ Multi-Language AI**
  - **Feature**: Agent automatically detects language (Arabic/French/English) and responds in kind.
  - **Tech**: Prompt engineering + Language detection layer.
  - **Benefit**: Serves a wider diverse customer base (Tourists vs Locals).

- **📢 Marketing Broadcasts (CRM)**
  - **Feature**: Send bulk offers to past customers (e.g., "Come back for 10% off").
  - **Tech**: Detailed segmentation in `Customers` module + WhatsApp Templates.
  - **Benefit**: Drives recurring revenue.

## 🛠️ Technical Debt & Infrastructure

- **Testing**: End-to-end testing for the WhatsApp flow.
- **Caching**: Redis caching for Restaurant and Menu data to reduce DB hits.
- **Rate Limiting**: Protect the API from abuse.
