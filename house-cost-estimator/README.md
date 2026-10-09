# House Cost Estimator (React + ReAct agent)

Estimates the cost of building a house in India (INR) from location, plot, storeys,
house plan, build quality and current material rates, with and without interiors.

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # engine tests
npm run build
```

## What it does
- **Land & location**: city (material + labour index), soil, slope, road access, site works.
- **House plan**: storeys (G to G+3), built-up area per floor, bedrooms/bathrooms/kitchens/other rooms; optional plan image for reference.
- **Rates**: editable cement, steel, brick, sand, aggregate prices (blank = reference rate x location index).
- **Interiors**: tick the items to include; tiles vs marble vs stone vs wood flooring per zone with Rs/sq ft; wood type for main door, room doors, bathroom doors and furniture (Rs/cft for solid timber).
- **Output**: total and Rs/sq ft without and with interiors, cost split, interior detail, tiles-vs-marble comparison, printable.

## ReAct workflow
`src/engine/agent.js` runs a Thought, Action, Observation loop over the tools in
`src/engine/tools.js`. The planner is rule-based and reads earlier observations
(weak soil + floors picks pile/raft foundation; over-dense plot triggers a bylaw
check). The trace is shown in the **Agent steps** tab. Swapping `planner()` for an
LLM would drive the same tools.

## Caveats
Prices in `src/data/catalog.js` are reference values, not live market data; edit them
for your area. The plan image is not analysed automatically. Output is a planning
estimate, not a quotation.
