import { countries, countryFlag, countryName } from "../data/countries.js";
export function CountryBadge({ code }) {
  if (!countryName(code)) return null;
  return (
    <span className="country-badge">
      <span aria-hidden="true">{countryFlag(code)}</span>
      <span>{countryName(code)}</span>
    </span>
  );
}
export function DailyPreferences({
  country,
  goal,
  onCountry,
  onGoal,
  required = false,
}) {
  return (
    <div className="daily-preferences">
      <label className="field">
        البلد
        <select
          name="countryCode"
          autoComplete="country"
          value={country || ""}
          required={required}
          onChange={(e) => onCountry(e.target.value)}
        >
          <option value="" disabled>
            اختر بلدك
          </option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {countryFlag(c.code)} {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        هدف الاستغفار اليومي
        <input
          name="istighfarGoal"
          type="number"
          inputMode="numeric"
          min="1"
          max="1000000"
          step="1"
          required
          value={goal}
          onChange={(e) => onGoal(e.target.value)}
        />
      </label>
    </div>
  );
}
