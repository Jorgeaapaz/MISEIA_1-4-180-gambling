# ADR-003: Proportional Payout Algorithm vs Fixed Odds

## Status
Accepted

## Context
Two main models exist for sports betting payouts:

### Model A: Fixed Odds (bookmaker model)
The house sets odds before the event (e.g., team1 wins at 2.5×, draw at 3.0×, team2 at 2.0×). Winners receive `amountBet × odds`. The house keeps a margin (typically 5–10%) built into the odds.

### Model B: Proportional / Parimutuel (pool model)
All bets on a match go into a pot. Winners split the entire pot proportionally to their stake. The house keeps nothing; the pot is always fully distributed.

```
payout(bet) = floor(bet.amountCents / winnersPot × totalPot)
```

**Numeric comparison with the same bets:**

| Bettor | Pick | Amount | Fixed Odds (2.0×) | Proportional |
|---|---|---|---|---|
| Alice | team1 | €10 | €20 (if wins) | €20 (if wins, with bob) |
| Bob | team1 | €5 | €10 (if wins) | €10 (if wins) |
| Carol | team2 | €15 | €30 (if wins) | — |
| **Pot** | | **€30** | **House keeps €5** | **House keeps €0** |

In the fixed-odds example above, if team1 wins, Alice gets €20 and Bob gets €10 = €30 paid out, but the house collected €30 in bets and pays €30 → margin = 0 in this case (odds were set exactly at 2.0×). If the house had set team1 odds at 1.8×, Alice gets €18 and Bob gets €9 = €27 out of €30 → house keeps €3 (10% margin).

Proportional always pays out 100% of the pot; the house never keeps a margin.

**Edge case:** If all bettors pick the same side and that side loses, `winnersPot = 0`. Fixed odds simply pay nothing. Proportional would attempt division by zero → the system detects this and fully refunds all bets (`status: refunded`).

## Decision
Implement the **proportional payout model** (`lib/payout.ts`). The spec explicitly defines this algorithm and the no-winners refund case. Fixed odds would require the admin to set odds per match (additional UX complexity) and a risk model to avoid the house losing money.

All values stored as **integer cents** with `Math.floor` to prevent floating-point drift:
- `Math.floor((1000 / 1500) × 3000) = Math.floor(2000.0) = 2000` ✓
- `Math.floor((999 / 1500) × 3000) = Math.floor(1998.0) = 1998` (1 cent of rounding stays in pot)

## Consequences

**Positive:**
- Simple algorithm with no house edge configuration
- Provably fair — pot is always fully distributed (or refunded)
- Integer arithmetic eliminates floating-point rounding errors in financial calculations
- Edge cases (no winners) handled explicitly via full refund

**Negative:**
- Winners do not know their payout until betting closes (odds are dynamic, not fixed upfront)
- Rounding with `Math.floor` means up to `N-1` cents (where N = number of winners) may remain undistributed in the pot
- No revenue model for the house (intentional for this educational project)

**Trade-offs:**
- The 1–N cent rounding gap is negligible at this scale. A production system would distribute the remainder to the largest winner or roll it into the next pot.
