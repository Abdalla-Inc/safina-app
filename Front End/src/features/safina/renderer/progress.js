export const PARTS = [
  "Keel & stem",
  "Forward ribs",
  "Midship ribs",
  "Aft ribs",
  "Crossbeams",
  "Lower hull I",
  "Lower hull II",
  "Lower hull III",
  "Lower hull IV",
  "Gun deck planking",
  "Upper hull I",
  "Upper hull II",
  "Gilded wales",
  "Forward deck",
  "Main deck",
  "Deck fittings",
  "Lower stern gallery",
  "Upper stern & quarterdeck",
  "Lower cannon battery",
  "Upper cannon battery",
  "Mizzenmast & rigging",
  "Mainmast & rigging",
  "Foremast & rigging",
  "Mizzen sails",
  "Main sails",
  "Fore sails",
  "Bowsprit & staysails",
  "Railings",
  "Lanterns",
  "Pennants & ornament",
];
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
export function stageAt(step) {
  if (step === 0)
    return {
      name: "A new beginning",
      description: "An open sea. A ship waiting to take shape.",
    };
  if (step <= 5)
    return {
      name: "Laying the foundations",
      description: "A keel, then ribs. The outline of something lasting.",
    };
  if (step <= 13)
    return {
      name: "Taking shape",
      description: "Warm timber wraps around the frame, plank by plank.",
    };
  if (step <= 18)
    return {
      name: "A place on the water",
      description: "The deck and cabin bring the vessel to life.",
    };
  if (step <= 23)
    return {
      name: "Built for the voyage",
      description: "Cannon decks and tall masts give the vessel its strength.",
    };
  if (step <= 27)
    return {
      name: "Catching the wind",
      description: "A new stretch of canvas. A little more wind in the sails.",
    };
  if (step < 30)
    return {
      name: "The finishing touches",
      description: "Railings and lanterns make this ship your own.",
    };
  return {
    name: "Ready for the horizon",
    description: "Thirty pieces, one vessel. Your Safina is fully built.",
  };
}
// Only an explicitly selected calendar month is presented by this adapter.
// The backend has not approved lifetime carry or a current-ship projection.
export function adaptShipProgress(payload, period) {
  const progress =
    payload?.schema === "ShipProgress" ? payload.fixture : payload;
  if (
    !progress ||
    progress.creditsPerShip !== 30 ||
    !Array.isArray(progress.periods)
  ) {
    throw new Error(
      "Expected a backend ShipProgress response with 30 credits per ship and periods.",
    );
  }
  const selected = progress.periods.find((item) => item.month === period);
  if (
    !selected ||
    !Number.isInteger(selected.approvedCredits) ||
    selected.approvedCredits < 0 ||
    selected.approvedCredits > 30
  ) {
    throw new Error(
      "Select a returned period containing 0–30 approved credits.",
    );
  }
  return {
    step: selected.approvedCredits,
    condition: 100,
    period,
    source: "backend-period",
    presentationStatus: progress.presentationStatus,
    // No inactivity calculation is possible from the sparse credit ledger.
    damagePolicy: "not-connected",
  };
}
