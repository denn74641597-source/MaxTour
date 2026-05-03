# Supabase Gaps (No Guessing)

Date: 2026-05-03

This file tracks mobile-referenced contracts where full schema details were not fully inferable from app code alone during this implementation pass.

## 1. Table Schema Detail Gaps

The following tables are actively referenced by mobile logic, but complete column-level contracts were not fully visible in code:

1. `tour_promotions`
2. `promotion_tiers`
3. `maxcoin_transactions`
4. `coin_requests`
5. `call_tracking`
6. `agency_subscriptions`

What is known is implemented (used columns only).  
Unknown columns were intentionally not invented.

## 2. RPC Return Payload Detail Gaps

The following RPC names are used with known argument names, but full returned row shape is partially inferred:

1. `get_featured_premium_tours_v1`
2. `get_fair_promoted_tours_v1`
3. `get_hot_tours_ranked`
4. `get_recommended_tours`
5. `get_sponsored_tours`
6. `get_tours_by_engagement`
7. `search_tours_public_v1`
8. `promote_tour_fair_v1`
9. `promote_tour_featured_fair_v1`

Implementation keeps RPC names and parameter names exact; response parsing remains defensive where schema is uncertain.

## 3. Follow-up Needed

To close these gaps safely:

1. Validate table shapes directly against production/staging Supabase schema metadata.
2. Validate RPC signatures and return schemas through SQL definitions.
3. Replace defensive `any`-style row parsing with exact typed payloads once SQL definitions are confirmed.
