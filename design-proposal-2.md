# Design Proposal 2: Workflow-Oriented Design

## Design Philosophy

**"Guided Paths to Success"** - This design organizes the app around specific user workflows and tasks. Instead of overwhelming users with data, it guides them through focused activities: reviewing transactions, planning budgets, addressing AI recommendations, etc.

**Core UX Principle**: Reduce decision paralysis by presenting one clear task at a time. Users feel accomplished after completing discrete workflows.

## Problem-Solution Mapping

| Current Budget App Problem | How This Design Solves It |
|---------------------------|---------------------------|
| Too reactive - users don't see problems until too late | **Proactive Task Queue**: "Action Items" inbox shows what needs attention NOW. Weekly predictions appear as actionable tasks, not passive reports. |
| Generic recommendations ignore user preferences | **Preference Capture Workflow**: Dedicated flow to capture constraints before AI runs. Recommendations always reference back to these. |
| No personalization for family constraints | **Context Collection**: As users tag transactions, system prompts for WHY. Builds rich preference model through interaction. |

## Screen Structure

### 1. Home Screen (Task-Oriented Hub)

**Layout**: Single-column focused design with task cards

```
┌─────────────────────────────────────────────────────────────┐
│ [< Oct 23] Today's Focus [Oct 25 >]            [👤 Profile] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Good morning! You have 3 tasks that need attention.         │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 🚨 URGENT                                               │ │
│ │                                                          │ │
│ │ Review Weekly Prediction                                │ │
│ │ You're trending $120 over budget for October            │ │
│ │                                                          │ │
│ │ Impact: High | Time: 5 minutes                          │ │
│ │                                                          │ │
│ │ [Start Review →]                                        │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 📋 TO DO                                                │ │
│ │                                                          │ │
│ │ Categorize 12 New Transactions                          │ │
│ │ Imported from Chase •••• 4321                           │ │
│ │                                                          │ │
│ │ Impact: Medium | Time: 3 minutes                        │ │
│ │                                                          │ │
│ │ [Start Categorizing →]                                  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 💡 RECOMMENDED                                          │ │
│ │                                                          │ │
│ │ Create November Budget                                  │ │
│ │ Get ahead of next month                                 │ │
│ │                                                          │ │
│ │ Impact: Low | Time: 5 minutes                           │ │
│ │                                                          │ │
│ │ [Start Planning →]                                      │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ────────────────────────────────────────────────────────── │
│                                                              │
│ Quick Stats                                                  │
│ This Month: $3,856 / $5,000 (77%) · 9 days left            │
│ Status: On Track ✅                                         │
│                                                              │
│ ────────────────────────────────────────────────────────── │
│                                                              │
│ Quick Actions                                                │
│ [View All Transactions] [See AI Insights] [Set New Goal]    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Bottom Navigation:
[🏠 Home] [📊 Budget] [💬 AI Coach] [⚙️ Settings]
```

**Key Principle**: Home screen is a to-do list, not a data dashboard. Users always know what to do next.

### 2. Transaction Review Workflow

**Triggered from**: "Categorize 12 New Transactions" task card

**Screen 1: Batch Review Interface**
```
┌─────────────────────────────────────────────────────────────┐
│ Categorize Transactions                        [✕ Exit]     │
│ Progress: 1 of 12                                            │
│ [████░░░░░░░░░░░░░░░░░░░░░░]                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│         Starbucks Coffee - Pike Place                        │
│         October 22, 2025 · $8.50                             │
│         Chase •••• 4321                                      │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │                                                          │ │
│ │ AI suggests: ☕ Dining Out                              │ │
│ │ Confidence: 95%                                          │ │
│ │                                                          │ │
│ │ Is this correct?                                         │ │
│ │                                                          │ │
│ │ [✓ Yes, correct] [✗ No, let me choose]                 │ │
│ │                                                          │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Additional actions:                                          │
│ [ ] Mark as non-negotiable expense                          │
│ [ ] Ignore this transaction                                 │
│                                                              │
│ Add note (optional): [_________________________]            │
│                                                              │
│                                                              │
│ [← Back] [Skip for now] [Confirm & Next →]                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**If user selects "No, let me choose"**:
```
┌─────────────────────────────────────────────────────────────┐
│ Choose Category                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [Search categories...]                                       │
│                                                              │
│ Suggested:                                                   │
│ [☕ Dining Out] [🛒 Groceries] [🎭 Entertainment]           │
│                                                              │
│ All Categories:                                              │
│ [🏠 Housing]                                                │
│ [🚗 Transportation]                                         │
│ [💼 Work Expenses]                                          │
│ [🏥 Healthcare]                                             │
│ [📱 Subscriptions]                                          │
│ [+ Create New Category]                                      │
│                                                              │
│ [Cancel] [Select]                                            │
└─────────────────────────────────────────────────────────────┘
```

**After categorizing all 12**:
```
┌─────────────────────────────────────────────────────────────┐
│ Great work! ✅                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ You categorized 12 transactions                              │
│                                                              │
│ Summary:                                                     │
│ • 8 confirmed AI suggestions (66%)                           │
│ • 3 recategorized                                            │
│ • 1 marked as non-negotiable                                 │
│                                                              │
│ Your budget is now up to date!                               │
│                                                              │
│ Updated spending:                                            │
│ Dining Out: $520 / $400 (30% over) ⚠️                        │
│                                                              │
│ [View Budget Impact] [Done]                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3. Weekly Prediction Workflow

**Triggered from**: "Review Weekly Prediction" task card

**Screen 1: Prediction Overview**
```
┌─────────────────────────────────────────────────────────────┐
│ Your Weekly Check-In                          [✕ Exit]      │
│ October 21 - 27, 2025                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│        Where you're headed this month...                     │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │                                                          │ │
│ │     Budget: $5,000                                       │ │
│ │     ┌──────────────────────────────────────────────┐   │ │
│ │     │░░░░░░░░░░░░░░░░░░░░░░████████████          │   │ │
│ │     └──────────────────────────────────────────────┘   │ │
│ │            Current     ↑                   Projected     │ │
│ │            $3,856    You are              $5,120         │ │
│ │            (Day 22)   here                (Day 31)       │ │
│ │                                                          │ │
│ │     ⚠️ Trending $120 OVER budget                        │ │
│ │                                                          │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Your goal: Stay under $5,000                                │
│ Likelihood: 35% (without changes)                           │
│                                                              │
│                                                              │
│ The AI analyzed your spending and has 3 suggestions          │
│ to get back on track.                                        │
│                                                              │
│ [See Suggestions →]                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Screen 2: Suggestion Review (Card Stack)**
```
┌─────────────────────────────────────────────────────────────┐
│ Suggestions to Get Back on Track          [✕ Exit]          │
│ Suggestion 1 of 3                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 💡 Reduce coffee shop visits                                │
│                                                              │
│ Current pace: 3 visits per week ($75/month)                  │
│ Suggested: 2 visits per week ($50/month)                     │
│                                                              │
│ Impact: Save $25 this month                                  │
│ Effort: Low                                                  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Why this suggestion?                                     │ │
│ │                                                          │ │
│ │ You told us coffee shops are important for your work,   │ │
│ │ so we're NOT suggesting cutting them entirely. Just     │ │
│ │ one fewer visit per week.                               │ │
│ │                                                          │ │
│ │ We're respecting your preference while helping you      │ │
│ │ hit your goal.                                           │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Will you try this?                                           │
│                                                              │
│ [👍 Yes, I'll try it] [👎 Not for me] [💬 Tell me more]   │
│                                                              │
│ [Skip] [Next Suggestion →]                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**If user clicks "Tell me more"**:
```
┌─────────────────────────────────────────────────────────────┐
│ Coffee Shop Spending Details                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Last 4 weeks:                                                │
│                                                              │
│ Week of Oct 14: 4 visits · $32                              │
│ • Starbucks (3x): $24                                        │
│ • Peet's Coffee (1x): $8                                     │
│                                                              │
│ Week of Oct 7: 3 visits · $28                               │
│ Week of Sep 30: 2 visits · $18                              │
│ Week of Sep 23: 3 visits · $26                              │
│                                                              │
│ Average: 3 visits/week · $26/week · $104/month              │
│                                                              │
│ If you reduce to 2 visits/week:                              │
│ Projected spend: $52/month                                   │
│ Savings: $52/month                                           │
│                                                              │
│ This would put you $25 under budget for October.            │
│                                                              │
│ [← Back to Suggestion]                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**After reviewing all suggestions**:
```
┌─────────────────────────────────────────────────────────────┐
│ Your Action Plan                              [✕ Exit]      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ You've chosen to try:                                        │
│                                                              │
│ ✅ Reduce coffee visits (1 less per week)                   │
│    Expected savings: $25                                     │
│                                                              │
│ ✅ Skip one restaurant meal this week                        │
│    Expected savings: $45                                     │
│                                                              │
│ Not interested in:                                           │
│ ⊗ Cancel gym membership                                      │
│                                                              │
│ ────────────────────────────────────────────────────────── │
│                                                              │
│ New projection with these changes:                           │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │     Budget: $5,000                                       │ │
│ │     ┌──────────────────────────────────────────────┐   │ │
│ │     │░░░░░░░░░░░░░░░░░░░░░░██████████░░          │   │ │
│ │     └──────────────────────────────────────────────┘   │ │
│ │                                         Projected:       │ │
│ │                                         $4,950 ✅        │ │
│ │                                                          │ │
│ │     Now trending $50 UNDER budget                        │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Likelihood of hitting goal: 85% 🎯                          │
│                                                              │
│ We'll check in next Monday to see how it's going.           │
│                                                              │
│ [Done] [Adjust My Plan]                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4. Budget Creation Workflow

**Triggered from**: "Create November Budget" task or from bottom nav

**Screen 1: Start**
```
┌─────────────────────────────────────────────────────────────┐
│ Create Budget                                 [✕ Exit]      │
│ Step 1 of 4                                                  │
│ [████████░░░░░░░░░░░░░░░░░░░░░]                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Which month?                                                 │
│                                                              │
│ ○ November 2025 (next month)                                │
│ ○ December 2025                                              │
│ ○ Custom date: [Select month ▼]                            │
│                                                              │
│                                                              │
│ [Cancel] [Next →]                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Screen 2: Copy or Start Fresh**
```
┌─────────────────────────────────────────────────────────────┐
│ Create November Budget                        [✕ Exit]      │
│ Step 2 of 4                                                  │
│ [████████████████░░░░░░░░░░░]                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ How would you like to start?                                 │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ○ Copy October budget ($5,000)                          │ │
│ │                                                          │ │
│ │   Start with your current month's budget                │ │
│ │   and adjust from there                                  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ○ Use 3-month average ($4,920)                          │ │
│ │                                                          │ │
│ │   Based on Aug, Sep, Oct spending                       │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ○ Start from scratch                                    │ │
│ │                                                          │ │
│ │   Build your budget from zero                           │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│                                                              │
│ [← Back] [Next →]                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Screen 3: Category by Category**
```
┌─────────────────────────────────────────────────────────────┐
│ Create November Budget                        [✕ Exit]      │
│ Step 3 of 4 · Category 1 of 8                                │
│ [████████████████████████░░]                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🛒 Groceries                                                │
│                                                              │
│ October budget: $1,500                                       │
│ October actual: $1,200 (80%)                                │
│ 3-month average: $1,350                                      │
│                                                              │
│ November budget:                                             │
│ [$_____________] or [Use Oct amount: $1,500]                │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 💡 AI Insight:                                          │ │
│ │                                                          │ │
│ │ You typically spend less in November (holidays shift    │ │
│ │ grocery patterns). Consider $1,400.                     │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Notes (optional):                                            │
│ [____________________________________________]               │
│                                                              │
│                                                              │
│ [← Previous Category] [Skip] [Save & Next →]                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Screen 4: Review & Confirm**
```
┌─────────────────────────────────────────────────────────────┐
│ Create November Budget                        [✕ Exit]      │
│ Step 4 of 4 · Review                                         │
│ [████████████████████████████]                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ November 2025 Budget Summary                                 │
│                                                              │
│ Category              Budget      vs October                 │
│ ──────────────────────────────────────────────              │
│ 🛒 Groceries          $1,400      -$100 (↓)                 │
│ ☕ Dining Out         $400        same                       │
│ 🚗 Transportation     $300        same                       │
│ 🏠 Housing            $2,000      same                       │
│ 🎭 Entertainment      $200        -$50 (↓)                  │
│ 💼 Other              $600        +$50 (↑)                  │
│ ──────────────────────────────────────────────              │
│ TOTAL                 $4,900      -$100 from October        │
│                                                              │
│ This budget is $100 less than October. Good for savings!    │
│                                                              │
│ [← Back to Edit] [Save Budget]                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Completion Screen**:
```
┌─────────────────────────────────────────────────────────────┐
│ Budget Created! ✅                                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Your November budget is ready.                               │
│                                                              │
│ Total: $4,900 across 6 categories                            │
│                                                              │
│ What's next?                                                 │
│                                                              │
│ [View Budget Details]                                        │
│ [Set November Goals]                                         │
│ [Back to Home]                                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5. Monthly Report Workflow

**Triggered**: Automatically on 1st of month, or manually from AI Coach

**Screen 1: Report Ready**
```
┌─────────────────────────────────────────────────────────────┐
│ Your October Report is Ready                  [✕ Exit]      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│         How did October go?                                  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │                                                          │ │
│ │     Budget: $5,000                                       │ │
│ │     Actual: $5,120                                       │ │
│ │                                                          │ │
│ │     Result: $120 over (102%)                            │ │
│ │                                                          │ │
│ │     Grade: B-                                            │ │
│ │                                                          │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ The AI spent 15 minutes analyzing your spending              │
│ and has personalized recommendations for you.                │
│                                                              │
│ [See What Happened →]                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Screen 2: What Went Well**
```
┌─────────────────────────────────────────────────────────────┐
│ October Report                                [✕ Exit]      │
│ Section 1 of 4                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ✅ What went well                                            │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Groceries: Under budget                                 │ │
│ │                                                          │ │
│ │ Budget: $1,500 · Actual: $1,420 · Saved: $80           │ │
│ │                                                          │ │
│ │ You maintained your family meal preferences while       │ │
│ │ staying under budget. Great discipline!                 │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Transportation: Well under                               │ │
│ │                                                          │ │
│ │ Budget: $300 · Actual: $220 · Saved: $80                │ │
│ │                                                          │ │
│ │ Gas prices dropped and you had fewer trips.             │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Total saved in these categories: $160                        │
│                                                              │
│ [Next: What Needs Work →]                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Screen 3: What Needs Work**
```
┌─────────────────────────────────────────────────────────────┐
│ October Report                                [✕ Exit]      │
│ Section 2 of 4                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ⚠️ What needs work                                          │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Dining Out: Significantly over                          │ │
│ │                                                          │ │
│ │ Budget: $400 · Actual: $580 · Over by: $180            │ │
│ │                                                          │ │
│ │ Breakdown:                                               │ │
│ │ • Coffee shops: 22 visits ($187)                        │ │
│ │ • Restaurants: 8 meals ($280)                           │ │
│ │ • Fast food: 6 visits ($113)                            │ │
│ │                                                          │ │
│ │ This is your biggest opportunity for savings.           │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Entertainment: At limit                                 │ │
│ │                                                          │ │
│ │ Budget: $200 · Actual: $200 · Right on budget           │ │
│ │                                                          │ │
│ │ No issues, but no room to grow.                         │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│                                                              │
│ [← Previous] [Next: Recommendations →]                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Screen 4: Top Recommendations**
```
┌─────────────────────────────────────────────────────────────┐
│ October Report                                [✕ Exit]      │
│ Section 3 of 4                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 💡 Top 3 recommendations for November                        │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ #1: Reduce coffee shop visits                           │ │
│ │                                                          │ │
│ │ Current: 22 visits/month ($187)                          │ │
│ │ Suggested: 12 visits/month ($102)                        │ │
│ │                                                          │ │
│ │ Savings: $85/month · Effort: Medium                     │ │
│ │                                                          │ │
│ │ You mentioned coffee shops help with work productivity. │ │
│ │ We're not suggesting eliminating them - just reducing   │ │
│ │ by half. Try alternating: coffee shop Mon/Wed/Fri,      │ │
│ │ home coffee Tue/Thu.                                     │ │
│ │                                                          │ │
│ │ [Accept] [Modify] [Reject]                              │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ #2: Pack lunch 2x per week                              │ │
│ │                                                          │ │
│ │ Current: Eat out for lunch 10x/month ($180)             │ │
│ │ Suggested: Pack lunch 8x/month, eat out 2x              │ │
│ │                                                          │ │
│ │ Savings: $144/month · Effort: Medium-High               │ │
│ │                                                          │ │
│ │ [Accept] [Modify] [Reject]                              │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ [← Previous] [Next: Action Plan →]                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Screen 5: Create Action Plan**
```
┌─────────────────────────────────────────────────────────────┐
│ October Report                                [✕ Exit]      │
│ Section 4 of 4                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Your November action plan                                    │
│                                                              │
│ Based on your choices:                                       │
│                                                              │
│ ✅ Reduce coffee shops (half visits) · Save $85             │
│ ✅ Pack lunch 2x/week · Save $144                           │
│ ⊗ Cancel streaming service (rejected)                       │
│                                                              │
│ ────────────────────────────────────────────────────────── │
│                                                              │
│ Projected November budget:                                   │
│                                                              │
│ Current October budget: $5,000                               │
│ With these changes:     $4,771                               │
│ Projected savings:      $229/month                           │
│                                                              │
│ ────────────────────────────────────────────────────────── │
│                                                              │
│ Want to set this as your November goal?                      │
│                                                              │
│ [ ] Yes, make "Stay under $4,771" my November goal          │
│                                                              │
│                                                              │
│ [← Previous] [Save Plan & Finish]                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6. Preference Capture Workflow

**Triggered**: During onboarding or from Settings → Preferences

**Screen 1: Welcome**
```
┌─────────────────────────────────────────────────────────────┐
│ Help the AI Understand You                   [✕ Exit]      │
│ Step 1 of 3                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ The more the AI knows about your priorities,                │
│ the better its recommendations will be.                      │
│                                                              │
│ This takes about 5 minutes.                                  │
│                                                              │
│ We'll ask about:                                             │
│ • Your spending priorities                                   │
│ • Family or lifestyle constraints                            │
│ • Areas you're willing to cut                                │
│ • Areas that are non-negotiable                              │
│                                                              │
│ You can update these anytime.                                │
│                                                              │
│ [Let's Go →]                                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Screen 2: Quick Questions**
```
┌─────────────────────────────────────────────────────────────┐
│ About Your Priorities                         [✕ Exit]      │
│ Step 2 of 3 · Question 1 of 5                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Which categories are non-negotiable for you?                 │
│ (Select all that apply)                                      │
│                                                              │
│ [ ] Groceries (family meals, dietary needs)                 │
│ [ ] Housing (rent, mortgage, utilities)                      │
│ [ ] Transportation (commute, family travel)                  │
│ [ ] Healthcare (insurance, medications)                      │
│ [ ] Childcare / Education                                    │
│ [ ] Debt payments                                            │
│ [ ] None - I'm flexible everywhere                          │
│                                                              │
│                                                              │
│ [← Back] [Next Question →]                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Screen 3: Free-Form Context**
```
┌─────────────────────────────────────────────────────────────┐
│ Tell Us More                                  [✕ Exit]      │
│ Step 3 of 3                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Anything else the AI should know?                            │
│                                                              │
│ Examples:                                                    │
│ • "I work from home, so coffee shop visits are important    │
│    for productivity and mental health"                       │
│ • "Our grocery budget is high because of dietary            │
│    restrictions"                                             │
│ • "Willing to cut all entertainment to pay off debt"        │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │                                                          │ │
│ │                                                          │ │
│ │                                                          │ │
│ │                                                          │ │
│ │                                                          │ │
│ │                                                          │ │
│ │ [500 characters remaining]                               │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ [← Back] [Skip] [Save Preferences]                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7. AI Coach (Bottom Nav)

**Purpose**: Conversational access to AI for questions and ad-hoc analysis

```
┌─────────────────────────────────────────────────────────────┐
│ AI Coach                                          [⚙]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Quick actions:                                               │
│ [Run weekly check-in] [Generate monthly report]             │
│                                                              │
│ ────────────────────────────────────────────────────────── │
│                                                              │
│ Previous conversations:                                      │
│                                                              │
│ Oct 21: Weekly check-in - Trending over budget              │
│ Oct 14: "Should I increase grocery budget?"                  │
│ Oct 1:  September monthly report                             │
│ Sep 23: "What if I cancel Netflix?"                          │
│                                                              │
│ ────────────────────────────────────────────────────────── │
│                                                              │
│ Ask the AI anything:                                         │
│                                                              │
│ Examples:                                                    │
│ • "Am I on track for my savings goal?"                      │
│ • "What if I spent $100 less on dining out?"                │
│ • "Show me my coffee spending trend"                        │
│                                                              │
│ [Type your question...]                         [Send]       │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Bottom Navigation:
[🏠 Home] [📊 Budget] [💬 AI Coach] [⚙️ Settings]
```

## Key User Flows

### Flow 1: Monday Morning Weekly Check-in
1. **Push notification**: "Your weekly check-in is ready"
2. User opens app → Lands on Home with URGENT task card
3. Taps "Start Review" → Sees prediction (trending over)
4. Taps "See Suggestions" → Swipes through 3 suggestion cards
5. Accepts 2, rejects 1
6. Sees updated projection (now on track)
7. **Completion**: Task disappears from Home, feels accomplished

### Flow 2: Categorizing Transactions (Gamified)
1. Home shows "12 transactions need categorizing"
2. User taps → Enters batch review mode
3. Progress bar at top (1 of 12, 2 of 12...)
4. For each: See transaction → Confirm or recategorize → Next
5. After all 12: Summary screen with stats
6. **Completion**: Task marked done, budget auto-updates

### Flow 3: Monthly Report → Goal Setting
1. Oct 31 11pm: System runs monthly analysis
2. Nov 1 morning: "October report ready" appears on Home
3. User goes through 4-step report (what went well, needs work, recommendations, action plan)
4. Accepts 2 of 3 recommendations
5. System auto-creates November goal based on accepted recommendations
6. **Completion**: November starts with clear, personalized goal

## Visual Design Principles

### Progressive Disclosure
- Show only what's needed for current task
- Hide complexity until user needs it
- Use "Tell me more" buttons for details

### Task Completion Satisfaction
- Clear progress bars (Step 1 of 4, 3/12 done)
- Completion screens with checkmarks and positive reinforcement
- Tasks disappear from Home when done

### Guided Choices
- Offer 2-3 options instead of blank fields
- Provide AI suggestions as defaults
- Always allow custom/skip options

### Consistent Flow Pattern
1. Task overview (what, why, time estimate)
2. Step-by-step guided actions
3. Review/summary
4. Completion celebration

## Mobile-First Considerations

- **Single-column layouts**: One task, one focus
- **Large tap targets**: Minimum 44px for all buttons
- **Bottom navigation**: Thumb-friendly access
- **Swipe gestures**: Swipe between suggestion cards, transaction cards
- **Pull-to-refresh**: Update data on Home screen

## Success Metrics

- **Task completion rate**: >80% of presented tasks completed
- **Time per task**: <3 minutes for most workflows
- **Recommendation acceptance**: >40% of AI suggestions tried
- **Weekly engagement**: User completes weekly check-in within 48 hours
- **Drop-off points**: <10% abandonment mid-workflow
