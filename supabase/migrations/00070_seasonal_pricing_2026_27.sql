-- 00070: seasonal pricing for Oct 2026 – Mar 2027.
--
-- Oct / Nov: existing weekday (₹14,000) and weekend (₹16,000) base rates apply.
-- No pricing rules needed for those months.
--
-- Dec 1–23:  ₹20,000 flat (all days, overrides weekday/weekend).
-- Dec 24–30: ₹30,000.
-- Dec 31 + Jan 1: ₹40,000 (replaces the earlier ₹16,000 NYE rule).
-- Jan 2 – Mar 31: ₹16,000 flat.
--
-- end_date is exclusive: the last priced night is the day before end_date.

DELETE FROM pricing_rules
 WHERE property_id = (SELECT id FROM properties WHERE slug = 'villa-19');

INSERT INTO pricing_rules (property_id, rule_name, start_date, end_date, nightly_rate, min_stay_nights)
SELECT p.id, v.rule_name, v.start_date, v.end_date, v.nightly_rate, 1
  FROM properties p
  CROSS JOIN (VALUES
    ('December',                     '2026-12-01'::date, '2026-12-24'::date, 2000000),
    ('Christmas to New Year''s Eve', '2026-12-24'::date, '2026-12-31'::date, 3000000),
    ('New Year''s Eve and Day',      '2026-12-31'::date, '2027-01-02'::date, 4000000),
    ('January 2027',                 '2027-01-02'::date, '2027-04-01'::date, 1600000)
  ) AS v(rule_name, start_date, end_date, nightly_rate)
 WHERE p.slug = 'villa-19';
