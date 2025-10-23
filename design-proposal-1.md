# Design Proposal 1: Dashboard-Centric Design

## Design Philosophy

**"Everything at a Glance"** - This design puts all critical information on a main dashboard with real-time insights. Users can see their budget health, AI recommendations, and take quick actions without deep navigation.

**Core UX Principle**: Reduce cognitive load by surfacing the most important information first, with progressive disclosure for details.

## Problem-Solution Mapping

| Current Budget App Problem | How This Design Solves It |
|---------------------------|---------------------------|
| Too reactive - users don't see problems until too late | **Proactive Dashboard**: Large, prominent "Budget Health Score" widget shows weekly trajectory prediction. Red/yellow/green visual indicators visible immediately on login. |
| Generic recommendations ignore user preferences | **Contextual AI Cards**: Recommendations always show WHY (based on your stated preference to maintain grocery spend) and offer alternatives. |
| No personalization for family constraints | **Preference-Aware Tags**: Non-negotiable transactions have special badge; AI visually acknowledges these constraints in all suggestions. |

## Screen Structure

### 1. Main Dashboard (Home Screen)

**Layout**: 3-column grid layout (left sidebar, main content, right panel)

**Left Sidebar (Navigation)**
```
[Logo]
────────────
Dashboard (active)
Transactions
Budgets
AI Insights
Goals & Preferences
Reports
────────────
[Profile Avatar]
Settings
```

**Main Content Area (Center)**
```
┌─────────────────────────────────────────────────┐
│ Budget Health Score: 72/100                     │
│ [Large circular progress indicator]             │
│ "You're on track! But watch dining out spending"│
│ [View Weekly Prediction →]                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🤖 AI Recommendations (Updated 2 days ago)      │
│                                                  │
│ 💡 Reduce coffee shop visits by 2/week          │
│    Save $40/month · Respects: Grocery spending   │
│    [Tell me more] [Not interested]              │
│                                                  │
│ 💡 Switch to annual insurance payment           │
│    Save $120/year · Low effort change            │
│    [Details] [Dismiss]                           │
│                                                  │
│ [See All Recommendations →]                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Spending by Category (This Month)               │
│ ╔════════════════════════════════╗              │
│ ║ Groceries        $1,200 / $1,500 ████░░  80%  │
│ ║ Dining Out       $520 / $400    ██████  130%⚠│
│ ║ Transportation   $180 / $300    ███░░░  60%   │
│ ║ Entertainment    $200 / $200    █████   100%  │
│ ╚════════════════════════════════╝              │
│ [View All Categories →]                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Recent Transactions                              │
│ Oct 22  Starbucks           $8.50    ☕ Dining   │
│         [Ignore] [Non-negotiable] [Recategorize]│
│ Oct 22  Whole Foods        $145.30   🛒 Grocery  │
│         [Ignore] [Non-negotiable] [Recategorize]│
│ Oct 21  Shell Gas          $52.00    🚗 Transport│
│         [Ignore] [Non-negotiable] [Recategorize]│
│ [View All Transactions →]                        │
└─────────────────────────────────────────────────┘
```

**Right Panel (Alerts & Actions)**
```
┌─────────────────────────┐
│ ⚠ Active Alerts         │
│ • Dining budget at 130% │
│ • Gas prices up 12%     │
│   [Adjust budget?]      │
└─────────────────────────┘

┌─────────────────────────┐
│ Quick Actions           │
│ [+ Add Transaction]     │
│ [+ Import from Bank]    │
│ [Create New Budget]     │
│ [Run AI Analysis Now]   │
└─────────────────────────┘

┌─────────────────────────┐
│ Weekly Check-In         │
│ "Based on your current  │
│  spending, you'll be    │
│  $120 over budget by    │
│  end of month"          │
│ [See Suggestions →]     │
└─────────────────────────┘
```

### 2. Transactions Screen

**Purpose**: Detailed transaction management with quick actions for categorization, tagging as non-negotiable, or ignoring.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Transactions                                                 │
│ [Search transactions...] [Filter ▼] [Import from Bank]      │
├─────────────────────────────────────────────────────────────┤
│ Filters: [All] [This Month] [Last Month] [Custom Range]     │
│ Categories: [All ▼] Sort by: [Date ▼]                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ October 22, 2025                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Starbucks Coffee                        $8.50         │   │
│ │ ☕ Dining Out · Card ending 4321                      │   │
│ │ [🔒 Non-negotiable] [🚫 Ignore] [↻ Recategorize]     │   │
│ │ Note: Add note... [💬]                                │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Whole Foods Market                    $145.30   🔒    │   │
│ │ 🛒 Groceries · Card ending 4321                       │   │
│ │ Tagged as Non-negotiable                              │   │
│ │ [Remove tag] [🚫 Ignore] [↻ Recategorize]            │   │
│ │ Note: "Weekly grocery run"                            │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ October 21, 2025                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Shell Gas Station                      $52.00         │   │
│ │ 🚗 Transportation · Checking account                  │   │
│ │ [🔒 Non-negotiable] [🚫 Ignore] [↻ Recategorize]     │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ [Load More] [Bulk Actions]                                  │
└─────────────────────────────────────────────────────────────┘
```

**Key Interactions**:
- **Click transaction**: Expands to show full details + quick action buttons
- **Non-negotiable tag**: Single click adds badge, affects AI recommendations
- **Ignore**: Grays out transaction, excludes from budget tracking
- **Recategorize**: Opens modal with category selector + reason field (teaches AI)

### 3. Budgets Screen

**Purpose**: Create and manage monthly budgets by category. Show current month + ability to create future months.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Budgets                                                      │
│ [← October 2025 →] [+ Create Future Month]                  │
├─────────────────────────────────────────────────────────────┤
│ Total Budget: $5,000 | Spent: $3,856 (77%)                  │
│ [Progress bar: ██████████████████░░░░]                      │
│                                                              │
│ Days remaining: 9 | Avg daily budget remaining: $127        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Categories                                                   │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 🛒 Groceries                                            │ │
│ │ Budget: $1,500 | Spent: $1,200 | Remaining: $300       │ │
│ │ [██████████████░░░░] 80%                               │ │
│ │ 🔒 12 transactions marked non-negotiable                │ │
│ │ [Edit Budget] [View Transactions]                       │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ☕ Dining Out                                     ⚠️     │ │
│ │ Budget: $400 | Spent: $520 | Over by: $120             │ │
│ │ [████████████████████] 130%                            │ │
│ │ 💡 AI suggestion: Reduce by 2 coffee visits/week       │ │
│ │ [Edit Budget] [View Transactions] [See AI Advice]      │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 🚗 Transportation                                       │ │
│ │ Budget: $300 | Spent: $180 | Remaining: $120           │ │
│ │ [████████████░░░░░░░░] 60%                            │ │
│ │ [Edit Budget] [View Transactions]                       │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ [+ Add Category]                                             │
│                                                              │
│ Future Months                                                │
│ [November 2025: Draft →] [+ Create December Budget]         │
└─────────────────────────────────────────────────────────────┘
```

**Edit Budget Modal**:
```
┌────────────────────────────────────┐
│ Edit Groceries Budget              │
├────────────────────────────────────┤
│ Month: October 2025                │
│ Budget Amount: [$1,500]            │
│                                    │
│ Copy from:                         │
│ ○ Last month ($1,450)              │
│ ○ 3-month average ($1,480)         │
│ ○ Custom amount (selected)         │
│                                    │
│ [Cancel] [Save]                    │
└────────────────────────────────────┘
```

### 4. AI Insights Screen

**Purpose**: Centralized view of all AI-generated recommendations, both weekly check-ins and monthly reports.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ AI Insights                                                  │
│ [Weekly Check-ins] [Monthly Reports] [Run New Analysis]     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 📊 Latest Weekly Check-in (October 21, 2025)                │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Budget Trajectory: On track ✅                          │ │
│ │                                                          │ │
│ │ Current pace: You'll finish month at $4,920 ($80 under) │ │
│ │                                                          │ │
│ │ 🎯 Your stated goal: Stay under $5,000                  │ │
│ │ Likelihood: 85% (High confidence)                       │ │
│ │                                                          │ │
│ │ ⚠️ Watch Areas:                                         │ │
│ │ • Dining Out (trending 30% over budget)                 │ │
│ │   Suggestion: Skip 2 coffee runs this week ($16)       │ │
│ │   Impact: Keeps you $64 under budget                   │ │
│ │                                                          │ │
│ │ • Entertainment (2 Amazon purchases in 3 days)          │ │
│ │   Suggestion: Pause non-essential purchases until       │ │
│ │   month end                                             │ │
│ │                                                          │ │
│ │ ✅ Going Well:                                          │ │
│ │ • Groceries maintaining budget (respecting your         │ │
│ │   non-negotiable tag on family meals)                   │ │
│ │ • Transportation under budget ($120 cushion)            │ │
│ │                                                          │ │
│ │ [View Analysis Details] [Download Report]               │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ 📈 Latest Monthly Report (September 2025)                   │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Month Summary: $120 over budget                         │ │
│ │                                                          │ │
│ │ Key Insights:                                            │ │
│ │ • Highest spend: Groceries ($1,600)                     │ │
│ │   Status: Non-negotiable (per your preferences) ✓       │ │
│ │                                                          │ │
│ │ • Biggest opportunity: Dining Out ($580)                │ │
│ │   Recommendation: Reduce by 20% = $116/month savings    │ │
│ │   How: Skip lunch out 1x/week, brew coffee at home      │ │
│ │   Respects: Your preference to keep family dinners out  │ │
│ │                                                          │ │
│ │ • Unexpected spend: Car repair ($350)                   │ │
│ │   Suggestion: Create emergency fund category            │ │
│ │                                                          │ │
│ │ 💡 Top 3 Recommendations to Hit Goals:                  │ │
│ │ 1. Coffee at home 4x/week (Save $60/month) [Easy]      │ │
│ │ 2. Cancel unused gym membership (Save $45/month)        │ │
│ │ 3. Switch to cheaper phone plan (Save $30/month)        │ │
│ │                                                          │ │
│ │ [View Full Analysis] [Chat with AI about this]          │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Previous Reports ▼]                                         │
└─────────────────────────────────────────────────────────────┘
```

**Run New Analysis Modal**:
```
┌────────────────────────────────────┐
│ Run AI Analysis                    │
├────────────────────────────────────┤
│ Analysis Type:                     │
│ ○ Weekly check-in (5-10 minutes)   │
│ ○ Monthly report (15-20 minutes)   │
│                                    │
│ Focus:                             │
│ ○ Reduce overall spending          │
│ ○ Hit specific goal (select below) │
│                                    │
│ [Select goal ▼]                    │
│                                    │
│ [Cancel] [Start Analysis]          │
└────────────────────────────────────┘
```

### 5. Goals & Preferences Screen

**Purpose**: User inputs goals and preferences that AI uses for personalized recommendations.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Goals & Preferences                                          │
│ "Help the AI understand your priorities"                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🎯 Your Financial Goals                                     │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Goal 1: Save $10,000 for vacation                  Active│ │
│ │ Target: June 2026 | Progress: $2,400 (24%)              │ │
│ │ "Family trip to Disney - non-negotiable"                │ │
│ │ [Edit] [Mark Complete] [Delete]                          │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Goal 2: Stay under $5,000/month             Active       │ │
│ │ Ongoing goal | Current month: On track ✅                │ │
│ │ [Edit] [Pause] [Delete]                                  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ [+ Add New Goal]                                             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 💭 Your Preferences & Constraints                           │
│ "Tell the AI what matters to you"                           │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Free-form text area:                                    │ │
│ │                                                          │ │
│ │ • I work from home, so coffee shop visits are important │ │
│ │   for my mental health and productivity. Don't suggest  │ │
│ │   cutting these entirely.                               │ │
│ │                                                          │ │
│ │ • Grocery budget is for family of 4, cannot reduce this │ │
│ │   due to dietary needs and preference for healthy food. │ │
│ │                                                          │ │
│ │ • Willing to cut entertainment and discretionary        │ │
│ │   spending to hit savings goals.                        │ │
│ │                                                          │ │
│ │ • Gas prices vary, so budget flexibility needed there.  │ │
│ │                                                          │ │
│ │ [500 characters remaining]                              │ │
│ │                                                          │ │
│ │ [Save Preferences]                                       │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Last updated: October 15, 2025                              │
│ AI will use these preferences in all recommendations.       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Add/Edit Goal Modal**:
```
┌────────────────────────────────────┐
│ Create New Goal                    │
├────────────────────────────────────┤
│ Goal Name:                         │
│ [Save for emergency fund]          │
│                                    │
│ Goal Type:                         │
│ ○ Savings target                   │
│ ○ Spending limit                   │
│ ○ Debt payoff                      │
│                                    │
│ Target Amount: [$5,000]            │
│ Target Date: [MM/DD/YYYY]          │
│                                    │
│ Notes (optional):                  │
│ [3-6 months expenses...]           │
│                                    │
│ Priority:                          │
│ ○ High ○ Medium ○ Low              │
│                                    │
│ [Cancel] [Save Goal]               │
└────────────────────────────────────┘
```

### 6. Account Setup & Bank Connection

**Purpose**: Secure account creation and bank account linking via Plaid.

**Screen 1: Sign Up**
```
┌────────────────────────────────────┐
│     Welcome to Budget AI           │
│                                    │
│ Create your secure account         │
│                                    │
│ Email: [________________]          │
│                                    │
│ Password: [________________]       │
│ Must be 12+ characters             │
│                                    │
│ Confirm Password: [_______]        │
│                                    │
│ ☑ I agree to Terms & Privacy      │
│                                    │
│ [Create Account]                   │
│                                    │
│ Already have account? [Log in]     │
└────────────────────────────────────┘
```

**Screen 2: Welcome Onboarding**
```
┌────────────────────────────────────┐
│     Let's get you set up           │
│                                    │
│ Step 1 of 3: Connect Your Bank    │
│                                    │
│ We use Plaid (bank-level security) │
│ to securely import your            │
│ transactions.                      │
│                                    │
│ Your data is encrypted and never   │
│ shared with third parties.         │
│                                    │
│ [🔒 Connect Bank Account]          │
│                                    │
│ [Skip for now]                     │
└────────────────────────────────────┘
```

**Screen 3: Plaid Integration**
```
[Plaid Modal - provided by Plaid SDK]
- Search for bank
- Enter credentials
- Select accounts to link
- Confirm connection
```

**Screen 4: Initial Budget Setup**
```
┌────────────────────────────────────┐
│ Step 2 of 3: Create First Budget   │
│                                    │
│ We've imported your last 30 days   │
│ of transactions.                   │
│                                    │
│ Here's what we found:              │
│ • Groceries: $1,200                │
│ • Dining: $450                     │
│ • Transportation: $200             │
│ • Other: $650                      │
│                                    │
│ Use these as your budget?          │
│ [Yes, looks good]                  │
│ [Let me adjust first]              │
│                                    │
│ [Skip - I'll set up later]         │
└────────────────────────────────────┘
```

**Screen 5: Set Goals**
```
┌────────────────────────────────────┐
│ Step 3 of 3: What's your goal?     │
│                                    │
│ ○ Save money each month            │
│ ○ Stay within a budget             │
│ ○ Pay off debt                     │
│ ○ Track spending only              │
│ ○ I'll decide later                │
│                                    │
│ [Continue]                         │
└────────────────────────────────────┘
```

**Screen 6: Ready!**
```
┌────────────────────────────────────┐
│     You're all set! 🎉             │
│                                    │
│ ✅ Bank connected                  │
│ ✅ Budget created                  │
│ ✅ Goal set                        │
│                                    │
│ Your first AI analysis will run    │
│ automatically next Monday.         │
│                                    │
│ [Go to Dashboard]                  │
└────────────────────────────────────┘
```

## User Flows

### Flow 1: New User Onboarding (First 5 minutes)
1. Sign up → Create account
2. Connect bank via Plaid (2-3 minutes)
3. System auto-categorizes imported transactions
4. Quick budget setup based on past 30 days
5. Set primary goal
6. **Success metric**: User sees first dashboard with data in under 5 minutes

### Flow 2: Weekly Check-In Interaction
1. **Monday morning**: Email notification "Your weekly budget check-in is ready"
2. User clicks → Lands on AI Insights screen
3. Sees trajectory prediction: "You're $80 over pace"
4. Reviews specific suggestions with context
5. Takes action: Marks 3 transactions as "non-negotiable"
6. AI re-runs analysis, updates prediction: "Now $20 under pace"
7. **Success metric**: User adjusts behavior based on prediction within 2 minutes

### Flow 3: Transaction Management with AI Learning
1. New transaction appears on dashboard
2. AI auto-categorizes as "Dining Out"
3. User recategorizes to "Work Expense"
4. System prompts: "Should future transactions from 'Panera Bread' be Work Expense?"
5. User confirms → AI learns pattern
6. **Success metric**: Categorization accuracy improves to 95%+ within 2 weeks

### Flow 4: Monthly Report → Action
1. **1st of month**: "Your September report is ready"
2. User opens report, sees top 3 recommendations
3. Each recommendation shows:
   - What to change
   - Expected savings
   - Which preferences it respects
   - Effort level (Easy/Medium/Hard)
4. User clicks "Tell me more" on coffee recommendation
5. Sees breakdown: 22 coffee transactions, $187 total
6. User sets new goal: "Only 2 coffee shop visits per week"
7. AI automatically tracks against this goal in future
8. **Success metric**: User implements at least 1 recommendation per month

## Visual Design Principles

### Colors to Use

For Overall Appearance: Use a monocromathic scale of blue that is slick and uses white spaces as the main backgroup color
For the Coding System: Create a color coding system that is aligened with the overall appearence color choises

### Coding System
- Positive Situations: On track, under budget, positive trends
- Medium Alert Situations: Warning, approaching limit, needs attention
- Alert Situations: Over budget, urgent action needed
- Neutral Situations: Neutral information, AI insights
- Ignore Situations: Ignored transactions, inactive categories

### Icon System
- Avoid using Icons in the design

### Responsive Behavior
- **Desktop (1200px+)**: 3-column layout as shown
- **Tablet (768-1199px)**: 2-column, right panel moves below main content
- **Mobile (< 768px)**: Single column, bottom navigation bar replaces sidebar

## Accessibility Considerations
- All color indicators have text labels (not color-only)
- Keyboard navigation for all actions
- Screen reader support for all widgets
- High contrast mode available
- Font size adjustable (WCAG 2.1 AA compliant)

## Key Differentiators from Current Budget Apps

1. **Proactive Dashboard**: Health score and trajectory visible immediately, not buried
2. **Context-Aware AI**: Every recommendation shows "Respects your preference to..."
3. **One-Click Actions**: Tag as non-negotiable, recategorize, ignore - all single clicks
4. **Visual Preference Acknowledgment**: Non-negotiable badge visible on transactions and in AI insights
5. **Weekly Predictions**: Not just "you spent $X" but "at this pace, you'll finish at $Y"

## Success Metrics

- **Time to first insight**: < 5 minutes from signup
- **Weekly engagement**: User checks weekly prediction within 24 hours
- **AI recommendation adoption**: > 30% of recommendations tried
- **Categorization accuracy**: 95%+ after 2 weeks
- **Goal achievement**: 60%+ of users hit monthly goals after 3 months
